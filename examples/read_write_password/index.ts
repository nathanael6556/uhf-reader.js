import uhf_reader from "../../src/index";
import { CTI809, PasswordBlock } from "../../src/reader";
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
      port.open({ baudRate: 57600 }).then(async () => {
        conn = new uhf_reader.connection.SerialConnection(port);
        reader = new CTI809(addr, conn);
        await app();
      })
    })
    .catch((e) => {
      // The user didn't select a port.
    });
});

let ACC_PWD = new Uint8Array([0x01, 0x01, 0x01, 0x01]);

async function app() {
  try {
    (await reader.inventory()).forEach(async (element) => {
      console.log("Inventory: ", bytesToHex(element));

      let pwd: PasswordBlock = await reader.read_data(
        element,
        reader.MEM_PWD,
        new Uint8Array([0]),
        new Uint8Array([0x4])
      ) as PasswordBlock;
      console.log("Access Password (initial): ", bytesToHex(pwd.access));
      console.log("Kill Password (initial): ", bytesToHex(pwd.kill));

      await reader.write_password(element, ACC_PWD);

      pwd = await reader.read_data(
        element,
        reader.MEM_PWD,
        new Uint8Array([0]),
        new Uint8Array([0x4]),
        ACC_PWD
      ) as PasswordBlock;
      console.log("Access Password (changed): ", bytesToHex(pwd.access));
      console.log("Kill Password: (changed)", bytesToHex(pwd.kill));

      try {
        await reader.lock(
          element,
          new Uint8Array([reader.SELECT_ACCESS_PWD]),
          new Uint8Array([reader.SP_SECURED]),
          ACC_PWD
        );
        console.log("Tried to lock PWD");
        try {
          pwd = await reader.read_data(
            element,
            reader.MEM_PWD,
            new Uint8Array([0]),
            new Uint8Array([0x4])
          ) as PasswordBlock;
          console.log("Password memory is not protected");
        } catch (e) {
          if (
            e instanceof TagReturnCodeError
            && e.tagErrorCode == reader.TAG_ERROR_MEMORY_LOCKED
          ) {
            console.log("Password memory is protected")
          } else {
            console.log(e.message);
          }
        }
        await reader.lock(
          element,
          new Uint8Array([reader.SELECT_ACCESS_PWD]),
          new Uint8Array([reader.SP_ANY]),
          ACC_PWD
        );
        console.log("Tried to unlock PWD");
      } catch (e) {
        console.log(e.message);
      }

      await reader.write_password(element, reader.PWD_ZERO, reader.PWD_ZERO, ACC_PWD);

      pwd = await reader.read_data(
        element,
        reader.MEM_PWD,
        new Uint8Array([0]),
        new Uint8Array([0x4])
      ) as PasswordBlock;
      console.log("Access Password (returned): ", bytesToHex(pwd.access));
      console.log("Kill Password (returned): ", bytesToHex(pwd.kill));
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
}