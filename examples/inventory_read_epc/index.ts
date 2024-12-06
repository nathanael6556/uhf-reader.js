import uhf_reader from "../../src/index";
import { CTI809, EPCBlock } from "../../src/reader";
import { SerialConnection } from "../../src/connection";
import { NoTagOperableError, PoorCommunicationError } from "../../src/exceptions";
import { bytesToHex } from "../../src/utils";

let connectButton = document.getElementById("serial-connect");

let addr = new Uint8Array([0]);
let conn: SerialConnection;
let reader: CTI809;

connectButton.addEventListener("click", () => {
  navigator.serial
    .requestPort()
    .then((port: SerialPort) => {
      port.open({ baudRate: 57600 }).then(() => {
        conn = new uhf_reader.connection.SerialConnection(port);
        reader = new CTI809(addr, conn);
        app();
      })
    })
    .catch((e) => {
      // The user didn't select a port.
    });
});

function delay(milliseconds){
  return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
  });
}

function random_bytes(length: number = 1): Uint8Array {
  return new Uint8Array(length);
}

async function app() {
  while (1) {
    try {
      (await reader.inventory()).forEach(async (element) => {
        console.log("EPC Inventory: ", bytesToHex(element));
        let epc: EPCBlock = await reader.read_data(
          element,
          reader.MEM_EPC,
          new Uint8Array([0]),
          new Uint8Array([0x0A])
        ) as EPCBlock;
        console.log("EPC Full: ", bytesToHex(epc.epc));
      });
    } catch (e) {
      if (
        e instanceof NoTagOperableError
        || e instanceof PoorCommunicationError
      ) {
        console.log(e.message);
      } else {
        throw e;
      }
    }

    await delay(1000);
  }
}