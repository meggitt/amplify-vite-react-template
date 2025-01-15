import { useAuthenticator } from '@aws-amplify/ui-react';
import SnakeGame from "./SnakeGame";
import "./snake.css";


function App() {
  const { signOut } = useAuthenticator();
  return (
    <main>
      <SnakeGame />
      <button className="signOut" onClick={signOut}>
        Sign out
      </button>
    </main>
  );
}

export default App;
