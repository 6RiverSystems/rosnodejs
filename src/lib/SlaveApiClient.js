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

"use strict";

let xmlrpc = require('@sixriver/xmlrpc');

//-----------------------------------------------------------------------

class AbortedError extends Error {
}

class SlaveApiClient {
  
  constructor(host, port) {
    this._xmlrpcClient = xmlrpc.createClient({host: host, port: port});
    this.requests = new Set();
  };

  requestTopic(callerId, topic, protocols) {
    let data = [callerId, topic, protocols];
    return new Promise((resolve, reject) => {
      let request = this._xmlrpcClient.methodCall('requestTopic', data, (err, resp) => {
        this.requests.delete(request);
        if(err instanceof AbortedError) {
          reject(err);
        }
        else if (err || resp[0] !== 1) {
          reject(err, resp);
        }
        else {
          resolve(resp);
        }
      });

      this.requests.add(request);
    });
  };

  shutdown() {
    // we should abort any outstanding requests that we haven't heard back from
    this.requests.forEach((request)=>{
      request.destroy(new AbortedError());
    });
    this.requests.clear();
  }
};

//-----------------------------------------------------------------------

module.exports = {
  SlaveApiClient,
  AbortedError
}
