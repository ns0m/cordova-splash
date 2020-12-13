var fs     = require('fs-extra');
var path   = require('path');
var glob   = require('glob');
var ig     = require('imagemagick');
var colors = require('colors');
var Q      = require('q');
var argv   = require('minimist')(process.argv.slice(2));

/**
 * @var {Object} settings - names of the config file and of the splash image
 */
var settings = {
  CONFIG_FILE: 'config.xml',
  SPLASH_FILE: 'splash.png',
  OLD_XCODE_PATH: false,
  OLD_ANDROID_PATH: false
};

/**
 * Init settings from options or argv
 *
 * @param {Object} options
 */
var initSettings = function (options = {}) {
  settings.CONFIG_FILE = options.config || argv.config || settings.CONFIG_FILE;
  settings.SPLASH_FILE = options.splash || argv.splash || settings.SPLASH_FILE;
  settings.OLD_XCODE_PATH = options['xcode-old'] || argv['xcode-old'] || settings.OLD_XCODE_PATH;
  settings.OLD_ANDROID_PATH = options['android-old'] || argv['android-old'] || settings.OLD_ANDROID_PATH;
};

/**
 * Return known platforms with their splash screen names and sizes
 *
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function () {
  var deferred = Q.defer();
  var platforms = [];
  var cordovaProjectRoot = path.dirname(settings.CONFIG_FILE);
  var xcodeFolder = 'Images.xcassets/LaunchImage.launchimage';
  var androidFolder = 'app/src/main/res';
  var windowsFolder = 'images';

  if (settings.OLD_XCODE_PATH) {
    xcodeFolder = 'Resources/splash';
  }
  if (settings.OLD_ANDROID_PATH) {
    androidFolder = 'res';
  }

  platforms.push({
    name: 'ios',
    splashPattern: path.join(cordovaProjectRoot, 'platforms/ios', '*', xcodeFolder),
    splashes: [
      // iPhone
      { name: 'Default~iphone.png',            width: 320,  height: 480  },
      { name: 'Default@2x~iphone.png',         width: 640,  height: 960  },
      { name: 'Default-568h@2x~iphone.png',    width: 640,  height: 1136 },
      { name: 'Default-667h.png',              width: 750,  height: 1334 },
      { name: 'Default-736h.png',              width: 1242, height: 2208 },
      { name: 'Default-Landscape-736h.png',    width: 2208, height: 1242 },
      { name: 'Default-2436h.png',             width: 1125, height: 2436 },
      { name: 'Default-Landscape-2436h.png',   width: 2436, height: 1125 },
      { name: 'Default-2688h.png',             width: 1242, height: 2688 },
      { name: 'Default-Landscape-2688h.png',   width: 2688, height: 1242 },
      { name: 'Default-1792h.png',             width: 828,  height: 1792 },
      { name: 'Default-Landscape-1792h.png',   width: 1792, height: 828  },
      // iPad
      { name: 'Default-Portrait~ipad.png',     width: 768,  height: 1024 },
      { name: 'Default-Portrait@2x~ipad.png',  width: 1536, height: 2048 },
      { name: 'Default-Landscape~ipad.png',    width: 1024, height: 768  },
      { name: 'Default-Landscape@2x~ipad.png', width: 2048, height: 1536 }
    ]
  });
  platforms.push({
    name: 'android',
    splashPattern: path.join(cordovaProjectRoot, 'platforms/android', androidFolder),
    splashes: [
      // Landscape
      { name: 'drawable-land-ldpi/screen.png',    width: 320,  height: 200  },
      { name: 'drawable-land-mdpi/screen.png',    width: 480,  height: 320  },
      { name: 'drawable-land-hdpi/screen.png',    width: 800,  height: 480  },
      { name: 'drawable-land-xhdpi/screen.png',   width: 1280, height: 720  },
      { name: 'drawable-land-xxhdpi/screen.png',  width: 1600, height: 960  },
      { name: 'drawable-land-xxxhdpi/screen.png', width: 1920, height: 1280 },
      // Portrait
      { name: 'drawable-port-ldpi/screen.png',    width: 200,  height: 320  },
      { name: 'drawable-port-mdpi/screen.png',    width: 320,  height: 480  },
      { name: 'drawable-port-hdpi/screen.png',    width: 480,  height: 800  },
      { name: 'drawable-port-xhdpi/screen.png',   width: 720,  height: 1280 },
      { name: 'drawable-port-xxhdpi/screen.png',  width: 960,  height: 1600 },
      { name: 'drawable-port-xxxhdpi/screen.png', width: 1280, height: 1920 }
    ]
  });
  platforms.push({
    name: 'windows',
    splashPattern: path.join(cordovaProjectRoot, 'platforms/windows', windowsFolder),
    splashes: [
      // Landscape
      { name: 'SplashScreen.scale-100.png', width: 620,  height: 300  },
      { name: 'SplashScreen.scale-125.png', width: 775,  height: 375  },
      { name: 'SplashScreen.scale-140.png', width: 868,  height: 420  },
      { name: 'SplashScreen.scale-150.png', width: 930,  height: 450  },
      { name: 'SplashScreen.scale-180.png', width: 1116, height: 540  },
      { name: 'SplashScreen.scale-200.png', width: 1240, height: 600  },
      { name: 'SplashScreen.scale-400.png', width: 2480, height: 1200 },
      // Portrait
      { name: 'SplashScreenPhone.scale-240.png', width: 1152, height: 1920 },
      { name: 'SplashScreenPhone.scale-140.png', width: 672,  height: 1120 },
      { name: 'SplashScreenPhone.scale-100.png', width: 480,  height: 800  }
    ]
  });
  deferred.resolve(platforms);
  return deferred.promise;
};

/**
 * @var {Object} console utils
 */
var display = {};
display.success = function (str) {
  str = '✓  '.green + str;
  console.log('  ' + str);
};
display.error = function (str) {
  str = '✗  '.red + str;
  console.log('  ' + str);
};
display.header = function (str) {
  console.log('');
  console.log(' ' + str.cyan.underline);
  console.log('');
};

/**
 * Crop and create a new splash in the platform's folder.
 *
 * @param  {Object} platform
 * @param  {Object} splash
 * @return {Promise}
 */
var generateSplash = function (platform, splash) {
  var deferred = Q.defer();
  var srcPath = settings.SPLASH_FILE;
  var platformPath = srcPath.replace(/\.png$/, '-' + platform.name + '.png');
  if (fs.existsSync(platformPath)) {
    srcPath = platformPath;
  }
  var dstPath = path.join(platform.splashPath, splash.name);
  var dst = path.dirname(dstPath);
  if (!fs.existsSync(dst)) {
    fs.mkdirsSync(dst);
  }
  ig.crop({
    srcPath: srcPath,
    dstPath: dstPath,
    quality: 1,
    format: 'png',
    width: splash.width,
    height: splash.height
  } , function(err, stdout, stderr){
    if (err) {
      deferred.reject(err);
    } else {
      display.success(splash.name + ' created');
      deferred.resolve();
    }
  });
  return deferred.promise;
};

/**
 * Generate splash based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateSplashForPlatform = function (platform) {
  var deferred = Q.defer();
  display.header('Generating splash screen for ' + platform.name);
  var all = [];
  platform.splashes.forEach(function (splash) {
    all.push(generateSplash(platform, splash));
  });
  Q.all(all).then(function () {
    deferred.resolve();
  }).catch(function (err) {
    console.log(err);
  });
  return deferred.promise;
};

/**
 * Go over the platforms and trigger splash screen generation
 *
 * @param  {Array} platforms
 * @return {Promise}
 */
var generateSplashes = function (platforms) {
  var deferred = Q.defer();
  var sequence = Q();
  var all = [];
  platforms.forEach(function (platform) {
    sequence = sequence.then(function () {
      return generateSplashForPlatform(platform);
    });
    all.push(sequence);
  });
  Q.all(all).then(function () {
    deferred.resolve();
  });
  return deferred.promise;
};

/**
 * Filter and transform platforms that are really added to the project
 *
 * @param  {Array} platforms
 * @return {Promise} resolves with the array of active platforms, rejects otherwise
 */
var asActivePlatforms = function (platforms) {
  var deferred = Q.defer();
  var activePlatforms = [];
  platforms.forEach(function (platform) {
    var splashPath = glob.sync(platform.splashPattern).shift();
    if (splashPath) {
      platform.splashPath = splashPath;
      activePlatforms.push(platform);
    }
  });
  if (activePlatforms.length > 0) {
    display.success('platforms found: ' + activePlatforms.map(function (platform) { return platform.name; }).join(', '));
    deferred.resolve(activePlatforms);
  } else {
    display.error(
      'No cordova platforms found. ' +
      'Make sure you are in the root folder of your Cordova project ' +
      'and add platforms with \'cordova platform add\''
    );
    deferred.reject();
  }
  return deferred.promise;
};

/**
 * Check if a valid splash file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validSplashExists = function () {
  var deferred = Q.defer();
  fs.exists(settings.SPLASH_FILE, function (exists) {
    if (exists) {
      display.success(settings.SPLASH_FILE + ' exists');
      deferred.resolve();
    } else {
      display.error(settings.SPLASH_FILE + ' does not exist');
      deferred.reject();
    }
  });
  return deferred.promise;
};

/**
 * Check if a config.xml file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var configFileExists = function () {
  var deferred = Q.defer();
  fs.exists(settings.CONFIG_FILE, function (exists) {
    if (exists) {
      display.success(settings.CONFIG_FILE + ' exists');
      deferred.resolve();
    } else {
      display.error('cordova\'s ' + settings.CONFIG_FILE + ' does not exist');
      deferred.reject();
    }
  });
  return deferred.promise;
};

function run(options) {
  display.header('Checking Project & Splash');
  initSettings(options);
  return configFileExists()
    .then(validSplashExists)
    .then(getPlatforms)
    .then(asActivePlatforms)
    .then(generateSplashes)
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    }).then(function () {
      console.log('');
    });
}

module.exports = run;
