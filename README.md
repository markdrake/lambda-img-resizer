# img-resizer
AWS lambda function to compress and resize images 

This is a Lambda Function which resizes/reduces images automatically. When an image is put on some AWS S3 bucket, this function will resize/reduce it and save it into same bucket with different prefix.

## Flow
The function should be invoked by a S3 trigger when a new image is uploaded to some S3 bucket. Once invoked, the function compresses and resizes (if needed)
the original image and save those copies into another bucket.
You can easily configure the widths of the resized image and their destination bucket/subfolder. 

- PNG images are saved as JPG
- if an image is smaller than a desired resizing, it is copied without being resized into destination bucket

## Requirements

- node.js

## Usage

- edit lambda-config.js file and assign name, description, memory size, timeout of your lambda function.
- edit .env file with your AWS access data
- npm install

## Deploy

- gulp clean
- gulp js
- gulp env
- gulp node-mods
- cd build
- npm uninstall sharp
- npm install --arch=x64 --platform=linux sharp
- cd ..
- gulp zip
- gulp deploy
