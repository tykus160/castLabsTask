"use strict";

const BOXES_WITH_CHILDREN = ["moof", "traf"];

class ISOAnalyzer {

  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  analyze() {
    while (this.offset < this.buffer.byteLength) {
      const size = this.getBoxSize();
      const name = this.getBoxName();
      console.log(`Found box of type ${name} and size ${size}`);
      
      if (name === "mdat") {
        const xml = this.getData(size - 8);
        console.log(this.uint8ArrayToString(xml));
      } else if (BOXES_WITH_CHILDREN.indexOf(name) === -1) {
        this.offset += size - 8;
      }
    }
  }

  getBoxName() {
    return this.uint8ArrayToString(this.getData(4));
  }

  getBoxSize() {
    return this.uint8ArrayToInt(this.getData(4));
  }

  getData(size) {
    const data = new Uint8Array(this.buffer, this.offset, size);
    this.offset += size;
    return data;
  }

  uint8ArrayToString(uint8Array) {
    return String.fromCharCode.apply(null, uint8Array);
  }
  
  uint8ArrayToInt(uint8Array) {
    let result = 0;
    for (let i = uint8Array.length - 1; i >= 0; --i) {
      result += uint8Array[i] << ((uint8Array.length - 1 - i) * 8);
    }
    return result;
  }
}

function downloadISO(uri) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => {
      reject("error");
    });
    reader.addEventListener("load", (e) => {
      resolve(e.target.result);
    });
    reader.readAsArrayBuffer(uri);
  });
}



// The first four bytes (bytes 0­3) specify the size (or length) of the box.
// Bytes 4­7 specify the type of the box.

async function analyzeISO(e) {
  const response = await downloadISO(e.target.files[0]);
  if (response instanceof ArrayBuffer) {
    const analyzer = new ISOAnalyzer(response);
    analyzer.analyze();
  }
}

document.getElementById("isoFile").addEventListener("change", analyzeISO);
