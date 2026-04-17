# Use a lightweight Nginx image to serve static content
FROM nginx:stable-alpine

# Copy all project files to the Nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80 for Cloud Run
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]
