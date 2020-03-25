import { extname } from 'path';

export const imageFileFilter = (req, file: { fieldname, originalname, mimetype, buffer, size }, callback) => {
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//     return callback(new Error('Only image files are allowed!'), false);
//   }
  callback(null, true);
};

export const editFileName = (req, file: { fieldname, originalname, mimetype, buffer, size }, callback) => {
  // const name = file.originalname.split('.')[0];
  // const fileExtName = extname(file.originalname);
  // const randomName = Array(4)
  //   .fill(null)
  //   .map(() => Math.round(Math.random() * 16).toString(16))
  //   .join('');
  // callback(null, `${name}-${randomName}${fileExtName}`);
  callback(null, file.originalname);
};