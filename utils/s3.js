const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = /^(?:1|true|yes)$/i.test(process.env.S3_FORCE_PATH_STYLE || '')
  || Boolean(endpoint);

let client = null;

const getClient = () => {
  if (client) return client;
  client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
  });
  return client;
};

const uploadBuffer = async (key, buffer, contentType) => {
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const s3 = getClient();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType });
  await s3.send(cmd);
  // produce a presigned GET URL valid for 7 days
  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(s3, getCmd, { expiresIn: 60 * 60 * 24 * 7 });
  return { key, url };
};

const getPresignedUrl = async (key, expiresInSeconds = 60 * 60 * 24 * 7) => {
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const s3 = getClient();
  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(s3, getCmd, { expiresIn: expiresInSeconds });
  return url;
};

const getObject = async (key) => {
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const s3 = getClient();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return s3.send(cmd);
};

const isConfigured = () => Boolean(bucket);

module.exports = {
  getObject,
  isConfigured,
  uploadBuffer,
  getPresignedUrl
};
