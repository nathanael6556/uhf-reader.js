import { parentPort } from "worker_threads";
import uhf_reader from  "../src/index";

let connectButton = document.getElementById("serial-connect");

connectButton.addEventListener("click", () => {
  navigator.serial
    .requestPort()
    .then((port: SerialPort) => {
      let conn = new uhf_reader.connection.SerialConnection(port);
      let addr = new Uint8Array([0]);
      let reader = new uhf_reader.reader.CTI809(addr, conn);
      console.log(reader.get_reader_info());
    })
    .catch((e) => {
      // The user didn't select a port.
    });
});