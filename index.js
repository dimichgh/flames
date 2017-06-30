'use strict';

const Assert = require('assert');
const Shell = require('shelljs');
const Fs = require('fs');
const NodePath = require('path');
const Profiler = require('v8-profiler');

let cpuProfileInProgress;

module.exports = function cpuProfileFactory(config) {
    const profilesLocation = config.profilesLocation || NodePath.resolve(process.cwd(), 'profiles');
    Shell.mkdir('-p', profilesLocation);

    return function cpuProfile(req, res, next) {
        var duration = req.query.duration;
        if (!req.query.file && duration && duration <=120 && duration >0) {
            if (cpuProfileInProgress) {
                res.status(403).send('CPU profiling is in progress');
                return;
            }
            cpuProfileInProgress = true;

            var fileName = `cpu-profile-${Date.now()}.json`;
            var cpuProfileTargetPath = NodePath.resolve(NodePath, fileName);

            setTimeout(function delayStart() {
                Profiler.startProfiling('CPU Profile', true);
                setTimeout(function completeRecording(){
                    cpuProfileInProgress = false;
                    var profile = Profiler.stopProfiling();
                    Profiler.export().pipe(Fs.createWriteStream(cpuProfileTargetPath))
                    .on('finish', function() {
                        profile.delete();
                    });
                }, duration * 1000);
            }, 500);

            req.query.file = fileName;
        }
    };
};
