# IBEC Website

International Business and Economics Club (IBEC) at the University of Pennsylvania website.

## Website URL
https://pennibec.com

## How to Update the Website

The website is automatically deployed to AWS S3 using GitHub Actions. Here's how to make updates:

### Quick Update Process:
1. Make changes to files in the `build/` folder
2. Commit your changes: `git add . && git commit -m "Update website content"`
3. Push to GitHub: `git push origin main`
4. Website automatically updates in 1-2 minutes!

### File Structure:
- `build/` - Main website files (this is what gets deployed)
  - `index.html` - Homepage
  - `committees.html` - Committee information
  - `events.html` - Recruiting events and schedule
  - `learn.html` - "How to Survive Wharton" guide
  - `portfolio.html` - Portfolio page
  - `contact.html` - Contact information
  - `header.js` - Navigation menu (shared across all pages)
  - `assets/` - CSS, JavaScript, and other resources
  - `images/` - All images used on the website

### Common Updates:

#### Adding a New Page:
1. Create new HTML file in `build/` folder
2. Follow the same structure as existing pages
3. Update navigation in `header.js` if needed
4. Commit and push changes

#### Updating Events/Recruiting:
1. Edit `build/events.html`
2. Update dates, times, and event details
3. Commit and push changes

#### Adding New Committee Members:
1. Edit `build/committees.html`
2. Add new member information and photos to `build/images/team/`
3. Commit and push changes

#### Updating Navigation:
1. Edit `build/header.js`
2. Add/remove menu items as needed
3. Commit and push changes

### How the Auto-Deployment Works:
- GitHub Actions workflow runs on every push to the repository
- Files from `build/` folder are synced to S3 bucket `pennibec.com`
- S3 bucket is configured for static website hosting
- Changes appear on the live website within 1-2 minutes

### GitHub Secrets Required:
The following secrets are configured in the repository (contact admin if these need updating):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Troubleshooting:
- Check the "Actions" tab in GitHub to see deployment status
- If deployment fails, check the error logs in the GitHub Actions tab
- Ensure all file paths are correct (case-sensitive)
- Make sure images are properly uploaded to the `images/` folder

### Development Tips:
- Test changes locally by opening HTML files in a browser
- Keep file names consistent (no spaces, use hyphens)
- Optimize images before uploading (compress for web)
- Always commit with descriptive messages

### Contact:
For technical issues with the website deployment, contact the current webmaster or IBEC leadership.
