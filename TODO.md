The vision:
- Basic/free: All the features of Areabook Planning
- $3/month? As many amazing productivity features as we can think of/code

Checkpoint 1: Core Functionality
- [ ] Convert it to a PWA so you can deploy it both as a website and an app
- [ ] Swiping to change the day on mobile
- [ ] Drag events between days
- [ ] Hold down on events a moment before being able to drag them with touch
- [ ] Import from image
  - [ ] Switch to Haiku if possible
  - [ ] Improve it with an internal monologue
  - [ ] Make the human confirmation dialogue box easier to understand
  - [ ] progress bar should show "Uploading" and then "Analyzing"

Checkpoint 2: User Experience and Settings
- [ ] Change formatting/layout to make it look like Areabook
- [ ] Improve color picking
- [ ] Search for event
    - [ ] Optional/future: search tools: search name, description, regex?
- [ ] Settings
  - [ ] Snap to: 30/15/5 minutes or No snapping
  - [ ] Theme: Light/Dark
  - [ ] Multiple planners side by side? If not, how should we make use of the extra space on computer screens?
  - [ ] Let the user make a list of types of events? (Work, Class, Meeting, Travel, etc.)
- [ ] "Quick Start" menu
    - [ ] Import from an image
    - [ ] Import from another calendar
    - [ ] Dictate your schedule (Audio to events)
    - [ ] Others...

Checkpoint 3: Authentication, Security, and Database
- [ ] Improve sign up page, recovery, etc.
- [ ] Improve login: email, connect with Google, password recovery, changing your information, etc.
- [ ] Review server-side `index.js` with Gen AI to make sure it's using good practices, ideal logging, etc.
  - [ ] And find out how to access the server-side logs
- [ ] Authentication: Look into rolling tokens to make a permanent token safer
- [ ] Security enhancements
    - [ ] https://owasp.org/www-project-top-ten/
    - [ ] https://docs.google.com/presentation/d/1qFUwZ9SbrCbJDTckmlCYoy9xMGqZZXscqMKJYkZEb_U/edit#slide=id.g21ced250365_0_186
    - [ ] Use Snyk or other tools?
    - [ ] Encrypt data as if you were already penatrated
    - [ ] Backups of user data
    - [ ] Run the code through an AI to find issues
    - [ ] Only let the AWS server access MongoDB
    - [ ] Log stuff to notice security issues
- [ ] Database: Info message when not online
  - [ ] Timestamp on data?
- [ ] Database: QOL: Login with Google

Checkpoint 4: Import and Export
- [ ] Import from other calendars
- [ ] Text to speech to calendar
- [ ] Import and export between calendars (ICS files)
  - [ ] And automatically sync with phone/Google/other calendars (live)

Checkpoint 5: Websocket and Real-time Updates
- [ ] Automatically update events like the Shared calendar
  - [ ] (Worth the processing power?)
- [ ] Edge Case: Events edited offline & online at once
  - [ ] Just use the most recent version? Or let the user choose?

Checkpoint 6: Additional Features and Enhancements
- [ ] Expand shared calendar feature or shared events
- [ ] Account for time zones
- [ ] Better logging
  - [ ] User notification bar for connection issues, authentication problems, etc.
- [ ] robots.txt
- [ ] Event expansion prioritizes longer names
- [ ] Types of Events (Determined by user, where?)
- [ ] Reminders/notifications
- [ ] Search for event
- [ ] Shared events
- [ ] Goals (Daily, Weekly, Monthly)
- [ ] To-do lists

Checkpoint 7: Performance Optimization
- [ ] Avoid unnecessary reloads
- [ ] Make it faster
    - [ ] Use localstorage before verifying with the server
    - [ ] Make the database searching to change exceptions more efficient
- [ ] Use Lighthouse, Pingdom, throttling, and dotcom-tools.com for performance analysis

Checkpoint 8: Testing and Release
- [ ] Use it yourself for a few weeks to see what you like and what you need to change
- [ ] Determine the framework to use to maintain the actual codebase
- [ ] Release it to a few enthusiastic beta testers?

Checkpoint 9: Extra Credit and Future Enhancements
- [ ] Improve landing page, add about page
- [ ] Progressive web application (See cs260 site)
  - [ ] Electron for cross-platform release
- [ ] Productivity tips (e.g., avoid distractions during important work time)
- [ ] Sync live with other calendars? (Using APIs)
- [ ] Localization (react-intl for Different languages)
- [ ] Responsive design
- [ ] Ideas for extensions/plugins:
    - [ ] Budgeting
    - [ ] Goals
    - [ ] Time tracker (for work/projects)
    - [ ] Map
    - [ ] Dating