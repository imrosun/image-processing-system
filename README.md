<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## API Documentation / Postman Collection APIs
### I have used "render" for hosting and when it is inactive then it can delay requests by 50 seconds or more. Kindly have patience till one request after that it becomes fast

### Copy curl and paste on postman to test APIs

- [x] POST https://image-processing-system-vmeb.onrender.com/process-image/upload
  -   Here you will make file submission by uploading csv file which will have imageInputUrls that will start compressing after submission
```bash 
curl --location 'https://image-processing-system-vmeb.onrender.com/process-image/upload' \
--form 'file=@"/path/to/file"'
```
  -   Body: give Key as `file` and Attach csv file on Value
  -   On success you will recieve requestId which will be in the form of shown below. It will help to check processing status. You can check the status of Image whether it is compressed or still in pending status.
  -   Response: {
        "message": "File uploaded successfully",
        "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434"
      }

- [x] GET https://image-processing-system-vmeb.onrender.com/process-image/status/:requestId
  -   Using the above endpoint you will be able to check processing status and see the compressed images in imageOutputUrls form
```bash 
curl --location 'https://image-processing-system-vmeb.onrender.com/process-image/status/80a03f07-e6e0-4a23-b356-c1d16c6a0434' \
--data ''
```
  -   ex: https://image-processing-system-vmeb.onrender.com/process-image/status/80a03f07-e6e0-4a23-b356-c1d16c6a0434  
  -   Response: {
        "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434",
        "status": "Completed",
        "results": [
          {
            "_id": "66d503f1d6e5e4f113a785b",
            "serialNumber": 1,
            "productName": "SKU1",
            "inputImageUrls": [
              "https://placebear.com/g/200/200", 
              "https://cdn.", 
              "https://via.plaf"
            ],
             "outputImageUrls": [
              "https://88.jpg",
              "https://89.jpg",
              "https://90.jpg"
            ],
            "status": "Completed",
            "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434",
            "__v": 1
          },
          {
            "_id": "66d503f1d6e5e4f0113a785d",
            "serialNumber": 2,
            "productName": "SKU2",
            "inputImageUrls": [
              "https://www.png",
              "https://y.png"
            ],
            "outputImageUrls": [
              "https://d0.jpg",
              "https://7.jpg"
            ],
            "status": "Completed",
            "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434",
            "__v": 1
          }
        ]
      }

- [x] POST https://image-processing-system-vmeb.onrender.com/process-image/webhook
  -   This will give status in short 
```bash  
curl --location 'https://image-processing-system-vmeb.onrender.com/process-image/webhook' \
--header 'Content-Type: application/json' \
--data '{ 
    "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434"
}'
```
  -   Body: { 
        "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434"
      }    
  -   Response: {
        "message": "Webhook processed successfully",
        "requestId": "80a03f07-e6e0-4a23-b356-c1d16c6a0434",
        "status": "Completed"
      }

- [x] GET https://image-processing-system-vmeb.onrender.com/process-image/
  -   This will just Get all entries
```bash
curl --location 'https://image-processing-system-vmeb.onrender.com/process-image/' \
--header 'Content-Type: application/json'
```
  -   Response: [{List out the uploads}]
  -   This can be disabled if needed

## Description

The project appears to be a Node.js application using NestJS that processes and compresses images and integrates with MongoDB and AWS S3.

## Key Features:
- Image Processing:
- Fetch Images: Retrieves images from given URLs.
- Compress Images: Utilizes sharp for image compression and resizing. Implements a quality adjustment and resizing to reduce image size effectively.
- Image Upload: Compresses images further using imagemin and mozjpeg, and uploads the processed images to AWS S3.

## Database Integration:
- MongoDB: Stores image processing records and metadata using Mongoose. Connects to MongoDB using a URI from environment variables.
  
## Configuration Management:
- Uses @nestjs/config to handle configuration and environment variables.

## Error Handling:
- Handles errors during image processing and uploading, including network errors and invalid URLs.

## Webhook Notifications:
- Sends notifications via webhook upon processing completion, including information about failed URLs.

## Data Management:
- CSV Processing: Parses and processes CSV files containing image URLs and other metadata.
- Database Operations: Provides CRUD operations for managing image processing records.

## Technologies Used:
- NestJS: Framework for building the application.
- Sharp: For image manipulation and compression.
- AWS S3: For storing processed images.
- Mongoose: For MongoDB interaction.
- ConfigModule: For configuration management.

## Application Flow:
- CSV Upload: Users upload CSV files containing image URLs.
- Image Processing: Images are fetched from URLs, resized, and compressed.
- Storage: Processed images are uploaded to AWS S3.
- Record Update: Database records are updated with the status and URLs of processed images.
- Notification: A webhook is triggered to notify completion and report any failed URLs.

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
# clone the repository
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

<!-- ## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework) -->

## License

Nest is [MIT licensed](LICENSE).
