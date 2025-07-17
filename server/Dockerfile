FROM node:20

# Install g++ for compiling C++
RUN apt-get update && apt-get install -y g++

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install
RUN npm install uuid

# Copy source files
COPY . .

# Expose the port your Hono app uses (change if not 10000)
EXPOSE 10000

# Run the app
CMD ["npm", "start"]
