"use strict";

const BOXES_WITH_CHILDREN = ["moof", "traf"];

class XMLImageDecoder {

  constructor(rawXml) {
    if (window.DOMParser) {
      const parser = new DOMParser();
      this.xml = parser.parseFromString(rawXml, "text/xml");
    } else {
      console.error("No XML parser found");
    }
  }

  decodeImages() {
    if (this.xml) {
      const images = this.xml.getElementsByTagName("smpte:image");
      for (let image of images) {
        if (image.getAttribute("encoding") === "Base64") {
          const encoded = image.childNodes[0].nodeValue;
          const imgElement = document.createElement("img");
          imgElement.className = "imgFromXml";
          imgElement.src = `data:image/png;base64, ${encoded}`;
          document.body.appendChild(imgElement);
        }
      }
    }
  }
}

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
        const xml = this.uint8ArrayToString(this.getData(size - 8));
        console.log(`Content of mdat box is: ${xml}`);
        const xmlDecoder = new XMLImageDecoder(xml);
        xmlDecoder.decodeImages();
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
