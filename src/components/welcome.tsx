import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const nqvigate = useNavigate();
  const handleClick = () => {
    nqvigate("/form");
  };
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('IMAGES/stellantis.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        overflow: "auto",
      }}
      aria-label="Stellantis company logo forms the background"
    >
      <button
        style={{
          position: "absolute",
          top: "80%",
          left: "90%",
          width: "150px",
          transform: "translate(-50%, -50%)",
          padding: "10px 20px",
          fontSize: "20px",
          backgroundColor: "black",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={handleClick}
      >
        Commencer les calculs
      </button>
    </div>
  );
};
export default Welcome;
