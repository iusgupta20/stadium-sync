# Use a lightweight Nginx image to serve static content
FROM nginx:stable-alpine

# Copy all project files to the Nginx html directory
COPY . /usr/share/nginx/html

# Inform Nginx to listen on port 8080 (Cloud Run default)
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]
