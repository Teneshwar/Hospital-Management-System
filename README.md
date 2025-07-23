# Hospital-Management-System
A full-stack web application designed to streamline and digitize hospital workflows. This system enables secure and efficient management of patients, doctors, appointments, and medical records with role-based authentication and a user-friendly interface.

## 🚀 Tech Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Others**: RESTful APIs, CORS, dotenv, nodemon

## ✨ Features

- 🧑‍⚕️ Role-based login system (Admin / Doctor / Patient)
- 📅 Appointment booking & management
- 🩺 Doctor management (add/edit/remove doctors)
- 🗂️ Patient record management
- 🔐 Secure login/signup with hashed passwords
- 💬 Success and error notifications
- 📱 Fully responsive and user-friendly interface

## 📁 Project Structure

## 🛠️ Installation

### 1. Clone the repository 

git clone https://github.com/teneshwar/hospital-management-system

cd hospital-management-system

### 2. Setup Backup
cd server
npm install 
#Create a .env file and add your MongoDB URI and JWT_SECRET
npm run dev

### 3. Setup Frontend
cd client
npm install
npm start

🌐 Environment Variables
Create a .env file in the server directory with the following:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000






