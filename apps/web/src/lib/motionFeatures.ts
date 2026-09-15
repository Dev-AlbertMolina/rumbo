import { domMax } from "framer-motion";

// Va en su propio archivo para que MotionProvider lo importe de forma
// diferida: las funciones de animar, salir y arrastrar llegan en un trozo
// aparte y no retrasan la primera pantalla.
export default domMax;
