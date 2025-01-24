import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    // Command to fetch problem statement and test cases
    const fetchTestCases = vscode.commands.registerCommand('cph.fetchTestCases', async () => {
        const url = await vscode.window.showInputBox({
            prompt: "Enter LeetCode problem URL",
        });

        if (!url) {
            vscode.window.showErrorMessage("LeetCode URL is required.");
            return;
        }

        try {
            // Extracting the problem titleSlug from the URL
            const titleSlugMatch = url.match(/(?:https:\/\/leetcode\.com\/problems\/)([^/]+)/);
            if (!titleSlugMatch) {
                vscode.window.showErrorMessage("Invalid LeetCode problem URL.");
                return;
            }
            const titleSlug = titleSlugMatch[1];

            // Making the API call to fetch problem details using the api provided in the resources
            const apiUrl = `https://alfa-leetcode-api.onrender.com/select?titleSlug=${titleSlug}`;
            const response = await axios.get(apiUrl);

            const problemStatement = response.data.question;
            if (!problemStatement) {
                vscode.window.showErrorMessage("No problem statement found for this problem.");
                return;
            }

            // Using regex to extract input-output pairs correctly
            const questionHTML = response.data.question;
            const inputOutputRegex = /<strong>Input:<\/strong>\s*(.+?)\n<strong>Output:<\/strong>\s*(.+?)\n/gs;

            const inputs: string[] = [];
            const outputs: string[] = [];
            let match;
            while ((match = inputOutputRegex.exec(questionHTML)) !== null) {
                // Extracting and cleaning inputs and outputs to avoid double or single quotes or brackets
                const rawInput = match[1].trim();
                const cleanedInput = rawInput.replace(/s\s*=\s*&quot;|&quot;/g, ""); // Remove `s = &quot;` and ending `&quot;`
                inputs.push(cleanedInput);

                const rawOutput = match[2].trim();
                outputs.push(rawOutput); // Outputs are already clean
            }

            if (inputs.length === 0 || outputs.length === 0) {
                vscode.window.showErrorMessage("No valid inputs or outputs found in the problem statement.");
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || __dirname;
            const problemFolder = path.join(workspaceFolder, titleSlug);

            // Creating the problem folder if it doesn't exist which will contain the problem statement and test cases
            if (!fs.existsSync(problemFolder)) {
                fs.mkdirSync(problemFolder, { recursive: true });
            }

            // Saving problem statement
            const statementPath = path.join(problemFolder, "problem_statement.txt");
            fs.writeFileSync(statementPath, problemStatement);

            // Creating test_cases folder
            const testCaseFolder = path.join(problemFolder, "test_cases");
            if (!fs.existsSync(testCaseFolder)) {
                fs.mkdirSync(testCaseFolder, { recursive: true });
            }

            // Saving input and output files
            inputs.forEach((input, index) => {
                const inputPath = path.join(testCaseFolder, `input_${index + 1}.txt`);
                const outputPath = path.join(testCaseFolder, `output_${index + 1}.txt`);
                fs.writeFileSync(inputPath, input);
                fs.writeFileSync(outputPath, outputs[index]);
            });

            vscode.window.showInformationMessage("Test cases and problem statement fetched successfully!");
        } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage("Failed to fetch test cases. Check the URL or API.");
        }
    });

    // Command to run test cases for the solution
    const runTestCases = vscode.commands.registerCommand('cph.runTestCases', async () => {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (!activeTextEditor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        // Getting the user's solution from the active editor
        const solutionCode = activeTextEditor.document.getText();

        // Extracting the titleSlug from the file path
        const problemFolder = path.dirname(activeTextEditor.document.uri.fsPath);
        const testCaseFolder = path.join(problemFolder, 'test_cases');

        if (!fs.existsSync(testCaseFolder)) {
            vscode.window.showErrorMessage("Test case files not found. Please fetch test cases first.");
            return;
        }

        // Executing the solution with each input and checking the output
        const inputs = fs.readdirSync(testCaseFolder).filter(file => file.startsWith('input_'));
        const results: { input: string; expected: string; actual: string; match: boolean }[] = [];

        for (let i = 0; i < inputs.length; i++) {
            const inputPath = path.join(testCaseFolder, `input_${i + 1}.txt`);
            const expectedOutputPath = path.join(testCaseFolder, `output_${i + 1}.txt`);
            const expectedOutput = fs.readFileSync(expectedOutputPath, 'utf-8').trim();

            const actualOutput = await executeSolution(solutionCode, inputPath);

            const result = {
                input: fs.readFileSync(inputPath, 'utf-8').trim(),
                expected: expectedOutput,
                actual: actualOutput,
                match: expectedOutput === actualOutput,
            };

            results.push(result);
        }

        // Displaying results
        displayResults(results);
    });

    context.subscriptions.push(fetchTestCases);
    context.subscriptions.push(runTestCases);
}

async function executeSolution(solutionCode: string, inputFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determining language based on file extension 
        const fileExtension = solutionCode.includes("def") ? "py" : "cpp"; // Basic check for Python or C++

        const tempFilePath = path.join(__dirname, "temp_solution." + fileExtension);
        fs.writeFileSync(tempFilePath, solutionCode);

        let command = "";

        if (fileExtension === "py") {
            command = `python "${tempFilePath}" < "${inputFilePath}"`;
        } else if (fileExtension === "cpp") {
            const outputPath = path.join(__dirname, "temp_executable");
            command = `g++ "${tempFilePath}" -o "${outputPath}" && "${outputPath}" < "${inputFilePath}"`;
        }

        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing solution: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }

            // Cleaning up temporary files
            fs.unlinkSync(tempFilePath);
            if (fileExtension === "cpp") {
                fs.unlinkSync(path.join(__dirname, "temp_executable"));
            }
        });
    });
}

// Function to display results in the VS Code output channel
function displayResults(results: { input: string; expected: string; actual: string; match: boolean }[]) {
    const outputChannel = vscode.window.createOutputChannel("CPH Test Results");

    results.forEach(result => {
        outputChannel.appendLine(`Input: ${result.input}`);
        outputChannel.appendLine(`Expected Output: ${result.expected}`);
        outputChannel.appendLine(`Actual Output: ${result.actual}`);
        outputChannel.appendLine(result.match ? 'Result: Passed' : 'Result: Failed');
        outputChannel.appendLine('---');
    });

    outputChannel.show();
}

export function deactivate() {}
