## The RM: a planner

### Elevator Pitch
An estimated 65 percent[^1] of students in BYU are returned missionaries, and every single one of us has been trained to live off our planner, sleep on the planner, and die for the planner. This AreaBook Planner (now called Preach My Gospel: the app) is an application that missionaries use to detail their days, plan their time, and track their results. Returned missionaries are left stranded without access to that planner app anymore, until now.

[^1]: https://magazine.byu.edu/article/answering-the-call/

### Design:
![The Design Mock-up](CS260MockUp.png)

### Key Features
- Secure login over HTTPS
- Ability to create events in your week and year
- Customization of event name and color
- Your schedule is persistently stored with your account
- Accesible from PC and mobile phone
### Possible Expansions
Depending on time and complexity of implementation, the website may also end up including:
- Notifications to the browser as events arrive
- Fill out if an event happened or not
- Customized repeating events
- Smooth mobile experience


### Technologies
I am going to use the required technologies in the following ways.

- **HTML** - The application uses standard HTML structure in two HTML pages: One for the login, and one for planning.
- **CSS** - The application will have good looking formatting and responsive design, along with good whitespace, color choice and contrast.
- **JavaScript** - Login process, event creation, customization, and display, backend endpoint calls.
- **Service** - A backend service with endpoints for:
    - login
    - retrieving schedule
    - creating events
    - retrieving changes to events
    - retrieving number of current users
- **DB/Login** - Store users and their schedules in a database. User information is stored securely, and used for registration and Login. Each schedule is associated with its user.
- **WebSocket** - As a schedule is changed it is updated on the server, allowing for simultaneous use between PC and mobile devices on the same schedule. Also, display of number of current users.
- **React** - Application ported to use the React web framework.