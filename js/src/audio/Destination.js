﻿/* global window, AudioListener, AudioContext */

import { WebAudioOldListenerPosition } from "./WebAudioOldListenerPosition.js";
import { WebAudioNewListenerPosition } from "./WebAudioNewListenerPosition.js";
import { InterpolatedPosition } from "./InterpolatedPosition.js";
import { MockAudioContext } from "./MockAudioContext.js";
import { VolumeOnlySpatializer } from "./VolumeOnlySpatializer.js";
import { FullSpatializer } from "./FullSpatializer.js";
import { StereoSpatializer } from "./StereoSpatializer.js";

let hasWebAudioAPI = window.hasOwnProperty("AudioListener"),
    hasFullSpatializer = hasWebAudioAPI && window.hasOwnProperty("PannerNode"),
    isLatestWebAudioAPI = hasWebAudioAPI && AudioListener.prototype.hasOwnProperty("positionX");

export class Destination {
    constructor() {
        this.minDistance = 1;
        this.maxDistance = 10;
        this.rolloff = 1;
        this.transitionTime = 0.125;

        try {
            if (hasWebAudioAPI) {
                this.audioContext = new AudioContext();
                try {
                    if (isLatestWebAudioAPI) {
                        this.position = new WebAudioNewListenerPosition(this.audioContext.listener);
                    }
                }
                catch (exp2) {
                    isLatestWebAudioAPI = false;
                    console.warn("No AudioListener.positionX property!", exp2);
                }
                finally {
                    if (!isLatestWebAudioAPI) {
                        this.position = new WebAudioOldListenerPosition(this.audioContext.listener);
                    }
                }
            }
        }
        catch (exp1) {
            hasWebAudioAPI = false;
            console.warn("No WebAudio API!", exp1);
        }
        finally {
            if (!hasWebAudioAPI) {
                this.audioContext = new MockAudioContext();
                this.position = new InterpolatedPosition();
            }
        }
    }

    setTarget(evt) {
        this.position.setTarget(evt.x, evt.y, this.audioContext.currentTime, this.transitionTime);
    }

    setAudioProperties(evt) {
        this.minDistance = evt.minDistance;
        this.maxDistance = evt.maxDistance;
        this.transitionTime = evt.transitionTime;
        this.rolloff = evt.rolloff;
    }

    update() {
        this.position.update(this.audioContext.currentTime);
    }

    createSpatializer(userID, audio, bufferSize) {
        try {
            if (hasWebAudioAPI) {
                try {
                    if (hasFullSpatializer) {
                        return new FullSpatializer(userID, this, audio, bufferSize);
                    }
                }
                catch (exp2) {
                    hasFullSpatializer = false;
                    console.warn("No 360 spatializer support", exp2);
                }
                finally {
                    if (!hasFullSpatializer) {
                        return new StereoSpatializer(userID, this, audio, bufferSize);
                    }
                }
            }
        }
        catch (exp1) {
            hasWebAudioAPI = false;
            console.warn("No WebAudio API!", exp1);
        }
        finally {
            if (!hasWebAudioAPI) {
                return new VolumeOnlySpatializer(userID, this, audio);
            }
        }
    }
}