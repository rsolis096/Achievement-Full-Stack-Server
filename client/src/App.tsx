import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  const [backend, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("http://localhost:3000/api")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data);
      });
  }, []);

  console.log("FROM /API : ", backend);

  return (
    <>
      <h1>React Front End</h1>
    </>
  );
}

export default App;
