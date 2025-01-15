import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";
import SnakeGame from "./SnakeGame";
import "./snake.css";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [loading, setLoading] = useState(true); // Track loading state

  // Function to create a new todo
  async function createTodo() {
    try {
      const newTodo = await client.models.Todo.create({
        content: "deff",
        currentScore: 0,
        highestScore: 0,
      });
      setTodos([newTodo]);
    } catch (error) {
      console.error("Error creating todo:", error);
    } finally {
      setLoading(false); // End loading after creation
    }
  }

  // Fetch todos on page load
  useEffect(() => {
    const fetchTodos = async () => {
      const subscription = client.models.Todo.observeQuery().subscribe({
        next: (data) => {
          const fetchedTodos = data.items;
          if (fetchedTodos.length === 0) {
            // Create a todo if the list is empty
            createTodo();
          } else {
            // Set todos and stop loading
            setTodos(fetchedTodos);
            setLoading(false);
          }
        },
        error: (error) => {
          console.error("Error fetching todos:", error);
          setLoading(false); // End loading on error
        },
      });

      return () => {
        subscription.unsubscribe(); // Clean up subscription
      };
    };

    fetchTodos();
  }, []);

  // Function to delete a todo
  async function deleteTodo(id: string) {
    try {
      await client.models.Todo.delete({ id });
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  // Display loading screen until todos are fetched or created
  if (loading) {
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    );
  }

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
