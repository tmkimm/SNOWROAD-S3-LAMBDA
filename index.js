const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // 버켓명
  const Key = event.Records[0].s3.object.key; // 업로드된 키명
  const s3obj = { Bucket, Key };

  const filename = Key.split("/")[Key.split("/").length - 1]; // 경로 없애고 뒤의 파일명만
  const ext = Key.split(".")[Key.split(".").length - 1].toLowerCase(); // 파일 확장자만

  const requiredFormat = ext === "jpg" ? "jpeg" : ext; // sharp에서는 jpg 대신 jpeg 사용

  try {
    //* 객체 불러오기
    const s3Object = await s3.getObject(s3obj).promise(); // 버퍼로 가져오기

    //* 리사이징
    const resizedImage = await sharp(s3Object.Body)
      .resize(300, 300, { fit: "cover" })
      .toFormat(requiredFormat)
      .toBuffer();

    //* 객체 넣기
    await s3
      .putObject({
        Bucket,
        Key: `event-thumbnail-images/${filename}`, // 리사이징 된 이미지를 thumb 폴더에 새로저장
        Body: resizedImage,
      })
      .promise();

    // Lambda 함수 내부에서 모든 작업을 수행한 후에는 그에 대한 결과(또는 오류)와 함께 callback 함수를 호출하고 이를 AWS가 HTTP 요청에 대한 응답으로 처리한다.
    return callback(null, `event-thumbnail-images/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
