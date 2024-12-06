import uhf_reader from "../../src/index";
import { CTI809, EPCBlock, PasswordBlock } from "../../src/reader";
import { SerialConnection } from "../../src/connection";
import { NoTagOperableError, PoorCommunicationError, TagReturnCodeError } from "../../src/exceptions";
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
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

async function app() {
  while (1) {
    try {
      (await reader.inventory()).forEach(async (element) => {
        console.log("Inventory: ", bytesToHex(element));
        let epc: EPCBlock = await reader.read_data(
          element,
          reader.MEM_EPC,
          new Uint8Array([0]),
          new Uint8Array([0x0A])
        ) as EPCBlock;
        console.log("EPC Full: ", bytesToHex(epc.epc));

        let tid: Uint8Array = await reader.read_data(
          element,
          reader.MEM_TID,
          new Uint8Array([0]),
          new Uint8Array([0x6])
        ) as Uint8Array;
        console.log("Tag ID: ", bytesToHex(tid));

        let pwd: PasswordBlock = await reader.read_data(
          element,
          reader.MEM_PWD,
          new Uint8Array([0]),
          new Uint8Array([0x4])
        ) as PasswordBlock;
        console.log("Access Password: ", bytesToHex(pwd.access));
        console.log("Kill Password: ", bytesToHex(pwd.kill));

        try {
          let user_mem: Uint8Array = await reader.read_data(
            element,
            reader.MEM_USER,
            new Uint8Array([0]),
            new Uint8Array([0x1])
          ) as Uint8Array;
          console.log("User Memory: ", bytesToHex(user_mem));
        } catch (e) {
          if (
            e instanceof TagReturnCodeError
            && e.tagErrorCode == reader.TAG_ERROR_MEMORY_OVERRUN
          ) {
            console.log("It seems like the tag doesn't have user memory");
          }
          else {
            throw e;
          }
        }
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