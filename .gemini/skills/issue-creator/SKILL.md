---
name: issue-creator
description: Specialized in creating high-quality GitHub issues following repository-specific templates for bugs and feature requests. Use when asked to report a bug or suggest a feature.
---
# Issue Creator Skill

This skill provides a structured workflow for Gemini CLI to generate and submit well-formatted GitHub issues based on project-specific templates.

## Objective
To streamline the issue creation process by automatically gathering necessary information and applying correct templates, ensuring all relevant details for reproduction or feature justification are captured.

## Workflow Instructions

When invoked to create an issue (bug report or feature request), follow these steps:

1. **Identify Issue Type:**
   - Determine if the request is for a **Bug Report** or a **Feature Request**.

2. **Gather Required Information:**
   - **For Bug Reports:**
     - A clear and concise **Title**.
     - **Description:** What is the bug?
     - **Steps to Reproduce:** List steps sequentially.
     - **Expected vs. Actual Behavior:** What should have happened vs. what actually happened.
     - **Environment Details:** OS, Browser, Version (if applicable).
     - **Additional Context:** Any other relevant information.
   - **For Feature Requests:**
     - A clear and concise **Title**.
     - **Problem Statement:** What problem does this feature solve?
     - **Proposed Solution:** Describe the desired functionality.
     - **Alternatives Considered:** Any other ways to solve the problem.
     - **Additional Context:** Any other relevant information.

3. **Format the Issue Body:**
   - Use the repository's templates found in `.github/ISSUE_TEMPLATE/` as a base for formatting the Markdown body.
   - Ensure clear headings and bullet points for readability.

4. **Execute Creation:**
   - Use `gh issue create --repo epam/med3web --title "TITLE" --body "BODY"` to create the issue.
   - If the user provides labels or assignees, include them using `--label` and `--assignee` flags.

## Constraints
- **Accuracy:** Ensure all "To Reproduce" steps are logical and based on the reported problem.
- **Completeness:** Do not skip sections from the template unless they are truly irrelevant.
- **Tone:** Maintain a professional and helpful tone in the issue description.
- **Verification:** Confirm with the user if any critical information is missing before submitting the issue.
