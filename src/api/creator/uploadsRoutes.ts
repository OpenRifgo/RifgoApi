import App from '../../App'
import {Image} from '../../entity/Image'
import {ExtError} from '../../lib/ExtError'
import {StatusCodes} from '../../lib/StatusCodes'
import {getFileExt} from '../../services/SimpleFileUploadService'

const app = App.getInstance();

export default function (router, opts, next) {

  router.post('/image', async (req, rep) => {
    const user = await app.AuthService.getUser(req.session);
    if (!user) throw new ExtError('User not authenticated', StatusCodes.FORBIDDEN);

    const options = {limits: {fileSize: 32*1024*1024}};
    const data = await req.file(options);

    const ext = getFileExt(data.filename);
    if (!['jpg', 'jpeg', 'png'].includes(ext)) throw `Unsupported image extension: ${ext}`;

    const uploadResult = await app.fileUploadService.upload(data.filename, data.file);

    // find top index image to setup new one
    const maxIndexImage = await app.dbm.findOne(Image, {
      where: {
        user: {id: user.id},
      },
      order: {index: 'DESC'},
    });

    const newIndex = (maxIndexImage?.index || 0) + 100;

    const image = app.dbm.create(Image, {
      uid: uploadResult.file.uid,
      ext: uploadResult.file.ext,
      user: {id: user.id},
      index: newIndex,
    });
    await app.dbm.save(image);

    rep.send({
      file: {
        name: uploadResult.file.name,
        uid: image.uid,
        ext: image.ext,
        index: image.index,
      },
    })
  });


  next();

}
