/*
 *    Copyright 2016 Rethink Robotics
 *
 *    Copyright 2016 Chris Smith
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// before requiring this module, set the environment variable: process.env.JS_MESSAGE_ABS_PATH_OVERRIDE
// in order to to provide an absolute path to the directory containing all projects where generated JS ros messages are located
const JS_MESSAGE_ABS_PATH_OVERRIDE = process.env.JS_MESSAGE_ABS_PATH_OVERRIDE;
const CMAKE_PREFIX_PATH = JS_MESSAGE_ABS_PATH_OVERRIDE ? JS_MESSAGE_ABS_PATH_OVERRIDE : process.env.CMAKE_PREFIX_PATH;
const cmakePaths = CMAKE_PREFIX_PATH.split(path.delimiter);
const jsMsgPath = path.join('share', 'gennodejs', 'ros');

//-----------------------------------------------------------------------
//  Search through the CMAKE_PREFIX_PATH for generated javascript messages.
//  Caches paths for any of the packages found in the desired location.
//  rosnodejs and generated message files will consult this cache to require
//  message packages
//-----------------------------------------------------------------------
const packagePaths = {};
cmakePaths.forEach((cmakePath) => {
  let dirPath = null;
  if(JS_MESSAGE_ABS_PATH_OVERRIDE) {
    dirPath = cmakePath;
  }
  else {
    dirPath = path.join(cmakePath, jsMsgPath);
  }
  try {
    let msgPackages = fs.readdirSync(dirPath);
    msgPackages.forEach((msgPackage) => {
      // If the message package has been found in a previous workspace,
      // don't overwrite it now. This is critical to enabling ws overlays.
      if (!packagePaths.hasOwnProperty(msgPackage)) {
        packagePaths[msgPackage] = path.join(dirPath, msgPackage, '_index.js');
      }
    });
  }
  catch(err) {
    // pass
  }
});

module.exports = {
  Find(messagePackage) {
    if (packagePaths.hasOwnProperty(messagePackage)) {
      return require(packagePaths[messagePackage]);
    }
    // else
    throw new Error(`Unable to find message package ${messagePackage} from CMAKE_PREFIX_PATH`);
  },

  CMAKE_PREFIX_PATH,
  JS_MESSAGE_ABS_PATH_OVERRIDE,
  CMAKE_PATHS: cmakePaths,
  MESSAGE_PATH: jsMsgPath,
  packageMap: Object.assign({}, packagePaths)
};
