# Use the official Node.js image as the base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json to the working directory
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the content of the local src directory to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3010:3000

# Build the Docusaurus static files
CMD ["npm start"]
