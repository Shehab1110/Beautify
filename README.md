<h1 align="center">Beautify</h1>
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js badge">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express badge">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB badge">
</p>
Beautify is a backend server designed to provide a comprehensive management solution for a cosmetics store. It is built using Node.js, Express.js, and MongoDB, offering a robust and scalable backend architecture.

## :rocket: Getting Started

To run this project locally, you need to have Node.js and MongoDB installed on your machine.

### Prerequisites

- Node.js
- MongoDB
- NPM or Yarn

### Installation

1. Clone this repo to your local machine using `git clone https://github.com/<your-username>/beautify.git`.
2. Go to the project directory using `cd Beautify`.
3. Install the dependencies using `npm install` or `yarn install`.
4. Create a `.env` file in the root folder and add the following environment variables:

`
NODE_ENV=development
PORT=3000
DATABASE=<your-mongodb-connection-string>
DATABASE_PASSWORD=<your-mongodb-password>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EMAIL_USERNAME=<your-email-username>
EMAIL_PASSWORD=<your-email-password>
EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_FROM=<your-email-address>
STRIPE_SECRET_KEY=<your-stripe-secret-key>`

Run the app using npm start or yarn start.<br> Open your browser and go to http://localhost:3000.<br> 

## :sparkles: Features

- **User Authentication**: Ensure secure access to protected routes and data by implementing user authentication using JSON Web Tokens (JWT). Users can securely register, log in, and access their account details.<br>

- **Product Management**: Effortlessly handle all aspects of cosmetics product management, including creation, retrieval, updating, and deletion. Each product can be defined with its name, description, price, image, category, rating, reviews, and more.<br>

- **Order Management**: Seamlessly manage customer orders, allowing for order creation, tracking, and status updates. The application supports orders with multiple products, quantities, shipping addresses, payment methods, and total prices.<br>

- **Ratings and Reviews**: Allow users to rate and review products, providing valuable feedback and insights. Display average ratings and reviews for products to help customers make informed purchasing decisions.<br>

- **Validation and Error Handling**: Implement robust validation and error handling mechanisms to ensure data integrity and provide meaningful error messages to clients. Validate user input and handle common errors gracefully.<br>

- **Email Notifications**: Enhance user experience by sending email notifications for critical events such as account creation, order confirmations, and other important updates. Utilize the SendGrid email service to reliably send notifications to users.<br>

- **Database Integration**: Seamlessly integrate with MongoDB, a powerful NoSQL database, to provide a flexible and scalable solution for data storage. Store and retrieve product information, order details, user data, ratings, and reviews efficiently.<br>

## :hammer_and_wrench: Technologies

Node.js<br> Express<br> MongoDB<br> Mongoose<br> Stripe<br> Sendgrid<br> Helmet<br> Morgan<br> Bcrypt<br> Validator<br> JWT<br> Multer<br> express-rate-limit<br> express-mongo-sanitize<br> xss-clean<br> 
## :construction: Project Status
This project is actively being developed and maintained, continuously adding new features and improving existing functionality. As such, there is always work to be done.
