### Fork of the [AlexDisler/cordova-splash](https://github.com/AlexDisler/cordova-splash) package with some fixes. [![Latest Published Version](https://img.shields.io/npm/v/@ns0m/cordova-splash)](https://www.npmjs.com/package/@ns0m/cordova-splash)
```
npm install @ns0m/cordova-splash
```

Adding local run, with or without options:
```js
const cordovaSplash = require('@ns0m/cordova-splash');

await cordovaSplash.generate();
await cordovaSplash.generate({project: '/path/to/helloCdv/', splash: '/path/to/images/splash.png'});
await cordovaSplash.generate({'xcode-old': true});
await cordovaSplash.generate({'android-old': true});
```

---

# cordova-splash

Automatic splash screen generator for Cordova. Create a splash screen and use _cordova-splash_ to automatically crop and copy it for all the platforms your project supports (currently works with iOS, Android and Windows 10).

The splash screen image should be 2208x2208 px with a center square of about 1200x1200 px. The image may be cropped around the center square. You can also use larger images with similar proportions.

### Installation

    $ sudo npm install cordova-splash -g

If you are using an older version of cordova (before 7.x):

    $ sudo npm install cordova-splash@0.12.0 -g

### Requirements

- ImageMagick installed (*Mac*: `brew install imagemagick`, *Debian/Ubuntu*: `sudo apt-get install imagemagick`, *Windows*: [download and install with "Legacy tools"](https://imagemagick.org/script/download.php#windows))
- At least one platform was added to your project ([cordova platforms docs](http://cordova.apache.org/docs/en/edge/guide_platforms_index.md.html#Platform%20Guides))

### Usage

Create a `splash.png` file in the root folder of your cordova project and run:

    $ cordova-splash

You also can specify manually a location for your cordova project or `splash.png`:

    $ cordova-splash --project=/path/to/helloCdv/ --splash=/path/to/images/splash.png

If you run an old version of Cordova for iOS and you need your files in `/Resources/icons/`, use this option:

    $ cordova-splash --xcode-old

If you run an old version of Cordova for Android and you need your files in `/res/`, use this option:

    $ cordova-splash --android-old

#### Notes:

- Cordova's config.xml file will not be updated by the tool (because images are automatically created in the good folders)
- Therefore, in Cordova's config.xml file, be sure to remove all lines looking like `<splash src="res/screen/android/splash-land-mdpi.png" density="land-mdpi"/>`

### Icons

Check out [cordova-icon](https://github.com/AlexDisler/cordova-icon)

### License

MIT
