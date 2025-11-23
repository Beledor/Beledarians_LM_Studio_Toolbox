import { text, tool, type Tool, type ToolsProviderController } from "@lmstudio/sdk";
import { spawn } from "child_process";
import { rm, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { findLMStudioHome } from "./findLMStudioHome";

function getDenoPath() {
  const lmstudioHome = findLMStudioHome();
  const utilPath = join(lmstudioHome, ".internal", "utils");
  const denoPath = join(utilPath, process.platform === "win32" ? "deno.exe" : "deno");
  return denoPath;
}

export async function toolsProvider(ctl: ToolsProviderController) {
  const tools: Tool[] = [];

  const runJavascriptTool = tool({
    name: "run_javascript",
    description: text`
      Run a JavaScript code snippet using deno. You cannot import external modules but you have 
      read/write access to the current working directory.

      Pass the code you wish to run as a string in the 'javascript' parameter.

      By default, the code will timeout in 5 seconds. You can extend this timeout by setting the
      'timeout_seconds' parameter to a higher value in seconds, up to a maximum of 60 seconds.

      You will get the stdout and stderr output of the code execution, thus please print the output
      you wish to return using 'console.log' or 'console.error'.
    `,
    parameters: {
      javascript: z.string(),
      timeout_seconds: z.number().min(0.1).max(60).optional().describe("Timeout in seconds (default: 5, max: 60)"),
    },
    implementation: async ({ javascript, timeout_seconds }) => {
      const workingDirectory = ctl.getWorkingDirectory();
      const scriptFileName = `temp_script_${Date.now()}.ts`;
      const scriptFilePath = join(workingDirectory, scriptFileName);
      await writeFile(scriptFilePath, javascript, "utf-8");

      const childProcess = spawn(
        getDenoPath(),
        [
          "run",
          "--allow-read=.",
          "--allow-write=.",
          "--no-prompt",
          "--deny-net",
          "--deny-env",
          "--deny-sys",
          "--deny-run",
          "--deny-ffi",
          scriptFilePath,
        ],
        {
          cwd: workingDirectory,
          timeout: (timeout_seconds ?? 5) * 1000, // Convert seconds to milliseconds
          stdio: "pipe",
          env: {
            NO_COLOR: "true", // Disable color output in Deno
          },
        },
      );

      let stdout = "";
      let stderr = "";

      childProcess.stdout.setEncoding("utf-8");
      childProcess.stderr.setEncoding("utf-8");

      childProcess.stdout.on("data", data => {
        stdout += data;
      });
      childProcess.stderr.on("data", data => {
        stderr += data;
      });

      await new Promise<void>((resolve, reject) => {
        childProcess.on("close", code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        childProcess.on("error", err => {
          reject(err);
        });
      });

      await rm(scriptFilePath);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    },
  });
  tools.push(runJavascriptTool);

  const runPythonTool = tool({
    name: "run_python",
    description: text`
      Run a Python code snippet. You cannot import external modules but you have
      read/write access to the current working directory.

      Pass the code you wish to run as a string in the 'python' parameter.

      By default, the code will timeout in 5 seconds. You can extend this timeout by setting the
      'timeout_seconds' parameter to a higher value in seconds, up to a maximum of 60 seconds.

      You will get the stdout and stderr output of the code execution, thus please print the output
      you wish to return using 'print()'.
    `,
    parameters: {
      python: z.string(),
      timeout_seconds: z.number().min(0.1).max(60).optional().describe("Timeout in seconds (default: 5, max: 60)"),
    },
    implementation: async ({ python, timeout_seconds }) => {
      const workingDirectory = ctl.getWorkingDirectory();
      const scriptFileName = `temp_script_${Date.now()}.py`;
      const scriptFilePath = join(workingDirectory, scriptFileName);
      await writeFile(scriptFilePath, python, "utf-8");

      const childProcess = spawn(
        "python",
        [
          scriptFilePath,
        ],
        {
          cwd: workingDirectory,
          timeout: (timeout_seconds ?? 5) * 1000, // Convert seconds to milliseconds
          stdio: "pipe",
        },
      );

      let stdout = "";
      let stderr = "";

      childProcess.stdout.setEncoding("utf-8");
      childProcess.stderr.setEncoding("utf-8");

      childProcess.stdout.on("data", data => {
        stdout += data;
      });
      childProcess.stderr.on("data", data => {
        stderr += data;
      });

      await new Promise<void>((resolve, reject) => {
        childProcess.on("close", code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        childProcess.on("error", err => {
          reject(err);
        });
      });

      await rm(scriptFilePath);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    },
  });
  tools.push(runPythonTool);

  const saveFileTool = tool({
    name: "save_file",
    description: text`
      Save content to a specified file in the current working directory.
      Returns the full path to the saved file.
    `,
    parameters: {
      file_name: z.string(),
      content: z.string(),
    },
    implementation: async ({ file_name, content }) => {
      const workingDirectory = ctl.getWorkingDirectory();
      const filePath = join(workingDirectory, file_name);
      await writeFile(filePath, content, "utf-8");
      return {
        success: true,
        path: filePath,
      };
    },
  });
  tools.push(saveFileTool);

  return tools;
}
