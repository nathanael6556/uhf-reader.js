import uhf_reader from "../../src/index";
import { CTI809 } from "../../src/reader";
import { SerialConnection } from "../../src/connection";

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

async function app() {
  while (1) {
    await reader.acoustooptic_control(
      new Uint8Array([20]),
      new Uint8Array([10]),
      new Uint8Array([10]),
    );
  }
}