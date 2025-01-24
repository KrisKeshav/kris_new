<<<<<<< HEAD
# kris_new
=======
# cph-kris README
# Description:
This VS Code extension allows users to interact with LeetCode problems efficiently by fetching problem statements, generating test cases, and running solutions directly from the VS Code. It supports multiple languages (currently Python and C++ only but can be made to support more languages by doing some changes) and displays results for each test case in the VS Code output section.

## Features

**Fetch Test Cases:** Enter a LeetCode problem URL to fetch the problem statement and corresponding input-output test cases.
**Run Test Cases:** Automatically run the solution of currently opened file against the fetched test cases. Displays the results (pass/fail) in the output panel.
**Multiple Language Support:** Detects Python and C++ code, executes solutions, and shows results.
**Directory Management:** Automatically creates folders to store the problem statement and input-output files(like input_1.txt, output_1.txt...), organizing them by problem.

## Requirements

**Axios**-- a popular Javascript library for making http requets as I have used Leetcode problem api which requires making http requests
**Leetcode API**-- https://alfa-leetcode-api.onrender.com/
**Python** -- for runing python solutions
**C++ compiler** -- for compiling and running c++ solutions(tested with g++)

## Commands:
**CPH: Fetch Test Cases:** Fetches the LeetCode problem statement and test cases based on the URL provided.
**CPH: Run Test Cases:** Executes the solution from the open editor and compares the output with the expected results.

**Usage:**
# Fetching Test Cases:
**1.** Press Ctrl+Shift+P (or Cmd+Shift+P on macOS) to open the Command Palette.
**2.** Type Fetch Test Cases and enter the LeetCode problem URL when prompted. The problem statement and test cases will be saved in a newly created folder.
# Running Test Cases:
**1.** Open the solution file you have written.
**2.** Press Ctrl+Shift+P (or Cmd+Shift+P on macOS) and type Run Test Cases.
**3.** The solution will be executed against each test case, and the results will be shown in the VS Code output channel.
## Known Issues

The most important part is the extraction of different types of test cases correctly and properly as this is the part where the possibility of occurence or error is much more. So using proper regex expression is very important. For this I used **POSTMAN**  to see and analyse the api response in different cases to adjust my code and regex expression to extract inputs and outputs correctly. The next important part is their storage and running but it is comparatively less time taking if we have done previous steps correctly. Issue may occur while trying to add more languages and hence I have used only C++ and Python for this extension to keep it simple.

## Release Notes

First version of my extension.
Initial release with functionality to fetch LeetCode problem statements and test cases.
Run and validate Python/C++ solutions directly in the editor.

### 1.0.0

Initial release of version 1

---
