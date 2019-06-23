"use strict";

const BOXES_WITH_CHILDREN = ["moof", "traf"];
const SIZE_BYTES = 4;
const NAME_BYTES = 4;
const BOX_BYTES = SIZE_BYTES + NAME_BYTES;

class XMLImageDecoder {

  constructor(rawXml) {
    try {
      if (window.DOMParser && typeof rawXml === "string") {
        const parser = new DOMParser();
        this.xml = parser.parseFromString(rawXml, "text/xml");
      }
    } catch (err) {
      // intentionally empty
    }
    if (!this.xml) {
      console.error("No DOM Parser found or input string broken");
    }
  }

  getSMPTENamespace() {
    let result = null;
    if (this.xml) {
      const tt = this.xml.getElementsByTagName("tt");
      result = tt && tt.length > 0 && tt[0] && tt[0].getAttribute("xmlns:smpte");
    }
    return result;
  }

  decodeImages() {
    if (this.xml) {
      const images = this.xml.getElementsByTagNameNS(this.getSMPTENamespace(), "image");
      for (let image of images) {
        if (image.getAttribute("encoding") === "Base64") {
          const encoded = image.childNodes[0].nodeValue;
          const imgElement = document.createElement("img");
          imgElement.src = `data:image/png;base64, ${encoded}`;
          document.body.appendChild(imgElement);
        }
      }
    }
  }
}

// The first four bytes (bytes 0-3) specify the size (or length) of the box.
// Bytes 4-7 specify the type of the box.

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
        const xml = this.uint8ArrayToString(this.getData(size - BOX_BYTES));
        console.log( `Content of mdat box is: ${xml}`);
        const xmlDecoder = new XMLImageDecoder(xml);
        xmlDecoder.decodeImages();
      } else if (BOXES_WITH_CHILDREN.indexOf(name) === -1) {
        this.offset += size - BOX_BYTES;
      }
    }
  }

  getBoxName() {
    return this.uint8ArrayToString(this.getData(NAME_BYTES));
  }

  getBoxSize() {
    return this.uint8ArrayToInt(this.getData(SIZE_BYTES));
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
    const xhr = new XMLHttpRequest();
    xhr.open("GET", uri);
    xhr.responseType = "blob";
    xhr.addEventListener("error", () => {
      reject("error");
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    });
    xhr.send();
  });
}

function readISO(uri) {
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

async function analyzeISO(uri) {
  let response;
  if (typeof uri === "string") {
    try {
      response = await downloadISO(uri);
    } catch (err) {
      console.error(err);
    }
  }
  if (response) {
    console.log(`Successfully loaded file ${uri}`);
    try {
      response = await readISO(response);
    } catch (err) {
      console.error(err);
    }
  }
  if (response instanceof ArrayBuffer) {
    const analyzer = new ISOAnalyzer(response);
    analyzer.analyze();
  }
}

analyzeISO("https://demo.castlabs.com/tmp/text0.mp4");
