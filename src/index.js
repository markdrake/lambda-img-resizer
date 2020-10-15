// dependencies
var async = require('async');
var path = require('path');
var AWS = require('aws-sdk');
const sharp = require('sharp');
require('dotenv').config();

// get reference to S3 client
var s3 = new AWS.S3();
const handler = function (event, context) {
  var bucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const destinationPath = `${path.dirname(srcKey)}/`.replace('/original/', '/resized/');
  var _sizesArray = [
    { width: 600, suffix: '_600' }, 
    { width: 400, suffix: '_400' } 
  ];

  // Infer the image type.
  var typeMatch = srcKey.match(/\.([^.]*)$/);
  var fileName = path.basename(srcKey);
  if (!typeMatch) {
    console.error('unable to infer image type for key ' + srcKey);
    return;
  }
  var imageType = typeMatch[1].toLowerCase();
  var imageTypes = ['jpg', 'png', 'gif', 'jpeg'];
  if (imageTypes.indexOf(imageType) === -1) {
    console.log('skipping non-image ' + srcKey);
    return;
  }

  console.log('optimizing image ', srcKey);
  async.waterfall([

    function download(next) {
      console.log('downloading image');
      console.log('srcKey', srcKey);
      s3.getObject({
        Bucket: bucket,
        Key: srcKey
      }, next);
    },

    function process(response, next) {
      const promises = [];

      for(var i = 0; i < _sizesArray.length; i++) (function(i) {
          promises.push(processImage(response.Body, i));
      })(i);

      function processImage(image, index) {
        console.log('processing image', srcKey);
        const width = _sizesArray[index].width;
        const position = fileName.lastIndexOf('.');
        // concat name
        let key = `${destinationPath}${fileName.slice(0, position)}${_sizesArray[index].suffix}.jpg`;
        return sharp(image)
          .toFormat('jpg')
          .resize(width)
          .toBuffer()
          .then(buff => uploadImage(bucket, key, buff))
      }

      return Promise.all(promises).then(
        function() {
          console.log('all resizing completed');
          next(null);
        }, function(err) {
          console.log('some resizing went wrong ' + err);
          next(err);
        });
    }

  ],
  function waterfallCallback (err) {
    if (err) {
      console.error('error during image optimization: ' + err);
    } else {
      console.error('image optimization successful');
    }
    context.done();
  });
};


function uploadImage(bucketName, key, buffer){

  console.log('uploading', key)
  return s3.putObject({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      CacheControl: 'public, max-age=5184000',
    }).promise();
}

exports.handler = handler