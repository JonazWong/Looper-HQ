/**
 * Bulk close automated RSS crawler issues
 * Usage: node scripts/close-automated-issues.js
 * Requires: GITHUB_TOKEN environment variable
 */

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const REPO_OWNER = 'JonazWong';
const REPO_NAME = 'Looper-HQ';

async function closeAutomatedIssues() {
  try {
    console.log('🔍 Fetching automated issues...');
    
    // Fetch all open issues with "automated" label
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'open',
      labels: 'automated',
      per_page: 100,
    });

    console.log(`📋 Found ${issues.length} automated issues`);

    if (issues.length === 0) {
      console.log('✅ No automated issues to close');
      return;
    }

    // Close each issue
    let closed = 0;
    for (const issue of issues) {
      await octokit.rest.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: issue.number,
        state: 'closed',
      });

      // Add closing comment
      await octokit.rest.issues.createComment({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: issue.number,
        body: '🤖 Auto-closed: RSS Crawler workflow has been disabled. See related PR for details.',
      });

      closed++;
      console.log(`✅ Closed #${issue.number}: ${issue.title}`);
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Successfully closed ${closed} issues!`);
    
    // Fetch remaining issues (pagination)
    if (issues.length === 100) {
      console.log('\n⚠️  More than 100 issues found. Run script again to close remaining issues.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

closeAutomatedIssues();
