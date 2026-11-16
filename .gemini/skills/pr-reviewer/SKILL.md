---
name: pr-reviewer
description: Generates high-quality PR descriptions and reviews. Use when asked to review a Pull Request, provide its purpose, value, architecture, weak points, or assess its current state considering latest comments and fixes.
---
# PR Reviewer Skill

This skill provides a structured workflow for Gemini CLI to analyze a Pull Request and generate a comprehensive review or description.

## Objective
To provide a high-quality summary and critical analysis of a Pull Request, incorporating recent comments and code changes to reflect its actual, current state.

## Workflow Instructions

When invoked to review a PR or generate a description, follow these steps systematically:

1. **Gather PR Context & Metadata:**
   - Run `gh pr view <PR_NUMBER_OR_URL>` to understand the title, description, and high-level status.
   - Run `gh pr comments <PR_NUMBER_OR_URL>` or `gh pr view <PR_NUMBER_OR_URL> --comments` to read the latest feedback and discussion. This is crucial for understanding the current state and any unresolved issues.

2. **Analyze Code Changes (The Diff):**
   - Run `gh pr diff <PR_NUMBER_OR_URL>` to see the exact code modifications.
   - Analyze the diff carefully. Pay special attention to how recent fixes address the comments retrieved in Step 1.

3. **Synthesize the Review / Description:**
   Construct a response formatted in Markdown with the following structured sections:

   ### 🎯 Purpose
   - A concise, one-sentence summary of what this PR does and why it was opened.

   ### 💎 Value Brought
   - Explain the tangible benefits this PR delivers to the user, the developer experience, or the business (e.g., fixes a critical bug, improves rendering performance, adds a requested feature).

   ### 🏗️ Architecture & Implementation Strategy
   - Summarize *how* the problem was solved. Mention key files modified, new patterns introduced, or existing systems altered.

   ### ⚠️ Disadvantages & Weak Points
   - Provide a critical analysis. Point out potential edge cases, missing test coverage, performance bottlenecks, or architectural compromises. If the PR is perfect, explicitly state that no obvious weak points were found.

   ### 💬 Current State & Recent Adjustments
   - Summarize the latest review comments and how the most recent code changes address them. State clearly if the PR is ready for merge, blocked, or requires further action based on the discussion.

## Constraints
- Focus on the *diff* and *comments*. Do not hallucinate context not present in the PR.
- If the diff is too large, suggest reviewing it file-by-file or focusing only on critical areas.