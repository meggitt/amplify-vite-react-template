import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;
const QUESTION_TIME_LIMIT = 10;
const REVIVAL_DISTANCE = 5;

type Position = {
  x: number;
  y: number;
};

type MathQuestion = {
  question: string;
  answer: number;
};

const calculateRevivalPosition = (deathPosition: Position, direction: string): Position => {
  let newX = deathPosition.x;
  let newY = deathPosition.y;

  switch (direction) {
    case 'UP':
      newY = Math.min(deathPosition.y + REVIVAL_DISTANCE, GRID_SIZE - 3);
      break;
    case 'DOWN':
      newY = Math.max(deathPosition.y - REVIVAL_DISTANCE, 2);
      break;
    case 'LEFT':
      newX = Math.min(deathPosition.x + REVIVAL_DISTANCE, GRID_SIZE - 3);
      break;
    case 'RIGHT':
      newX = Math.max(deathPosition.x - REVIVAL_DISTANCE, 2);
      break;
    default:
      break;
  }

  newX = Math.max(2, Math.min(newX, GRID_SIZE - 3));
  newY = Math.max(2, Math.min(newY, GRID_SIZE - 3));

  return { x: newX, y: newY };
};

const generateMathQuestion = (): MathQuestion => {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1, num2, answer;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50);
      num2 = Math.floor(Math.random() * 50);
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 50;
      num2 = Math.floor(Math.random() * num1);
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12);
      num2 = Math.floor(Math.random() * 12);
      answer = num1 * num2;
      break;
    default:
      throw new Error('Unexpected operation');
  }

  return {
    question: `${num1} ${operation} ${num2} = ?`,
    answer: answer,
  };
};

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<string>('RIGHT');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const [mathQuestion, setMathQuestion] = useState<MathQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [reviveAttempts, setReviveAttempts] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [revivalMethod, setRevivalMethod] = useState<string | null>(null);
  const [deathPosition, setDeathPosition] = useState<Position | null>(null);
  const [deathDirection, setDeathDirection] = useState<string | null>(null);
  const [deathSnake, setDeathSnake] = useState<Position[] | null>(null);

  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }
    return newFood;
  }, [snake]);

  useEffect(() => {
    if (gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        switch (direction) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
          default:
            break;
        }

        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE ||
          newSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          setDeathPosition(newSnake[0]);
          setDeathDirection(direction);
          setDeathSnake(newSnake);
          return prevSnake;
        }

        newSnake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood());
          setScore(prev => prev + 10);
          setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, generateFood, speed]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameOver) return;

      switch (event.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  useEffect(() => {
    if (!mathQuestion || !timerActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          setReviveAttempts(prev => prev - 1);
          if (reviveAttempts <= 1) {
            resetGame();
          } else {
            setMathQuestion(generateMathQuestion());
            setUserAnswer('');
            return QUESTION_TIME_LIMIT;
          }
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mathQuestion, timerActive, reviveAttempts]);

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimerActive(false);

    if (parseInt(userAnswer) === mathQuestion?.answer) {
      const revivalPos = calculateRevivalPosition(deathPosition!, deathDirection!);
      const revivedSnake = reconstructSnake(revivalPos, deathSnake!);

      setGameOver(false);
      setMathQuestion(null);
      setUserAnswer('');
      setTimeLeft(QUESTION_TIME_LIMIT);
      setRevivalMethod(null);
      setSnake(revivedSnake);
      setDirection(deathDirection!);
    } else {
      setReviveAttempts(prev => prev - 1);
      if (reviveAttempts <= 1) {
        resetGame();
      } else {
        setMathQuestion(generateMathQuestion());
        setUserAnswer('');
        setTimeLeft(QUESTION_TIME_LIMIT);
        setTimerActive(true);
      }
    }
  };

  const resetGame = () => {
    setSnake([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setMathQuestion(null);
    setUserAnswer('');
    setReviveAttempts(3);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setTimerActive(false);
    setRevivalMethod(null);
    setDeathPosition(null);
    setDeathDirection(null);
    setDeathSnake(null);
  };

  const reconstructSnake = (revivalPos: Position, originalSnake: Position[]): Position[] => {
    const newSnake: Position[] = [];
    const length = originalSnake.length;

    newSnake.push({ x: revivalPos.x, y: revivalPos.y });

    for (let i = 1; i < length; i++) {
      const prevSegment = newSnake[i - 1];
      let newSegment;

      switch (deathDirection) {
        case 'RIGHT':
          newSegment = { x: prevSegment.x - 1, y: prevSegment.y };
          break;
        case 'LEFT':
          newSegment = { x: prevSegment.x + 1, y: prevSegment.y };
          break;
        case 'DOWN':
          newSegment = { x: prevSegment.x, y: prevSegment.y - 1 };
          break;
        case 'UP':
          newSegment = { x: prevSegment.x, y: prevSegment.y + 1 };
          break;
        default:
          newSegment = { x: prevSegment.x - 1, y: prevSegment.y };
      }
      newSnake.push(newSegment);
    }

    return newSnake;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      minHeight: 'fit-content',
      overflowY: 'hidden' as const,
    },
    gameBoard: {
      display: 'grid',
      gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
      gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
      gap: '1px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '10px',
      padding: '10px',
    },
    cell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: '4px',
    },
    snakeCell: {
      background: 'linear-gradient(45deg, #00f260 0%, #0575e6 100%)',
    },
    foodCell: {
      background: 'linear-gradient(45deg, #ff416c 0%, #ff4b2b 100%)',
      borderRadius: '50%',
    },
    revivalChoice: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '30px',
      borderRadius: '15px',
      color: 'white',
      textAlign: 'center' as const,
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    },
    mathQuestion: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '30px',
      borderRadius: '15px',
      color: 'white',
      textAlign: 'center' as const,
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
      minWidth: '300px',
    },
    input: {
      margin: '10px 0',
      padding: '8px',
      fontSize: '18px',
      borderRadius: '5px',
      border: '2px solid #0575e6',
      width: '100px',
      textAlign: 'center' as const,
    },
    button: {
      padding: '10px 20px',
      fontSize: '16px',
      background: 'linear-gradient(45deg, #00f260 0%, #0575e6 100%)',
      border: 'none',
      borderRadius: '5px',
      color: 'white',
      cursor: 'pointer',
      transition: 'transform 0.1s ease',
      marginTop: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <div>Score: {score}</div>
      {gameOver && !revivalMethod && (
        <div style={styles.revivalChoice}>
          <h3>Choose Your Revival Method</h3>
          <button
            style={styles.button}
            onClick={() => {
              setRevivalMethod('math');
              setMathQuestion(generateMathQuestion());
              setTimerActive(true);
            }}
          >
            Solve Math Question
          </button>
          <button style={styles.button} onClick={resetGame}>End Game</button>
        </div>
      )}
      {revivalMethod === 'math' && mathQuestion && (
        <div style={styles.mathQuestion}>
          <h3>Solve to Continue!</h3>
          <p>{mathQuestion.question}</p>
          <form onSubmit={handleAnswerSubmit}>
            <input
              type="number"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>Submit</button>
          </form>
          <p>Time Remaining: {timeLeft}s</p>
          <p>Remaining Attempts: {reviveAttempts}</p>
        </div>
      )}
      <div style={styles.gameBoard}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          const isSnake = snake.some(segment => segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              style={{
                ...styles.cell,
                ...(isSnake && styles.snakeCell),
                ...(isFood && styles.foodCell),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SnakeGame;
