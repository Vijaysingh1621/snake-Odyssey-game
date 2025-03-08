"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  WormIcon as Snake,
  Apple,
  Trophy,
  Gamepad2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function SnakeOdyssey() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [direction, setDirection] = useState("RIGHT")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameActive, setGameActive] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const gameBoardSize = 20 // 20x20 grid
  const speed = 100 // Game speed in ms
  const gameRef = useRef<{ x: number; y: number } | null>(null)
  const eatSoundRef = useRef<HTMLAudioElement>(null)
  const gameOverSoundRef = useRef<HTMLAudioElement>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement>(null)

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  // Update high score when game ends
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score)
      localStorage.setItem("snakeHighScore", score.toString())
    }
  }, [gameOver, score, highScore])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive) return

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "DOWN") setDirection("UP")
          break
        case "ArrowDown":
          if (direction !== "UP") setDirection("DOWN")
          break
        case "ArrowLeft":
          if (direction !== "RIGHT") setDirection("LEFT")
          break
        case "ArrowRight":
          if (direction !== "LEFT") setDirection("RIGHT")
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [direction, gameActive])

  // Handle touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gameActive) return
    const touch = e.touches[0]
    gameRef.current = { x: touch.clientX, y: touch.clientY }
  }

  interface TouchCoordinates {
    x: number;
    y: number;
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gameActive || !gameRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - gameRef.current.x
    const deltaY = touch.clientY - gameRef.current.y

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && direction !== "LEFT") setDirection("RIGHT")
      else if (deltaX < 0 && direction !== "RIGHT") setDirection("LEFT")
    } else {
      if (deltaY > 0 && direction !== "UP") setDirection("DOWN")
      else if (deltaY < 0 && direction !== "DOWN") setDirection("UP")
    }
  }

  // Play sound effect
  const playSound = (soundRef: React.RefObject<HTMLAudioElement | null>) => {
    if (soundEnabled && soundRef.current) {
      soundRef.current.currentTime = 0
      soundRef.current.play().catch((e) => console.error("Audio play failed:", e))
    }
  }

  // Game loop
  useEffect(() => {
    if (!gameActive || gameOver) return

    const moveSnake = () => {
      setSnake((prev) => {
        const newSnake = [...prev]
        const head = { ...newSnake[0] }

        // Move head based on direction with wrapping
        switch (direction) {
          case "UP":
            head.y = (head.y - 1 + gameBoardSize) % gameBoardSize
            break
          case "DOWN":
            head.y = (head.y + 1) % gameBoardSize
            break
          case "LEFT":
            head.x = (head.x - 1 + gameBoardSize) % gameBoardSize
            break
          case "RIGHT":
            head.x = (head.x + 1) % gameBoardSize
            break
        }

        // Check collision with self (excluding the head itself)
        if (newSnake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true)
          playSound(gameOverSoundRef)
          return prev
        }

        newSnake.unshift(head) // Add new head

        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
          setScore((prev) => prev + 1)
          playSound(eatSoundRef)

          // Generate new food position that's not on the snake
          let newFood: { x: number; y: number }
          do {
            newFood = {
              x: Math.floor(Math.random() * gameBoardSize),
              y: Math.floor(Math.random() * gameBoardSize),
            }
          } while (newSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))

          setFood(newFood)
        } else {
          newSnake.pop() // Remove tail if no food eaten
        }

        return newSnake
      })
    }

    const gameInterval = setInterval(moveSnake, speed)
    return () => clearInterval(gameInterval)
  }, [direction, food, gameOver, gameActive])

  // Start game
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection("RIGHT")
    setScore(0)
    setGameOver(false)
    setGameActive(true)
  }

  // Restart game
  const restartGame = () => {
    setGameActive(false)
    setTimeout(startGame, 500) // Small delay for better UX
  }

  // Toggle sound
  const toggleSound = () => {
    const newSoundState = !soundEnabled
    setSoundEnabled(newSoundState)

    // Update background music state
    if (backgroundMusicRef.current) {
      if (newSoundState) {
        backgroundMusicRef.current.play().catch((e) => console.error("Audio play failed:", e))
      } else {
        backgroundMusicRef.current.pause()
      }
    }
  }

  // Get cell color based on position in snake
  const getCellColor = (index: number, length: number) => {
    if (length === 1) return "from-emerald-400 to-emerald-600"

    if (index === 0) return "from-emerald-300 to-emerald-500" // Head
    if (index === length - 1) return "from-emerald-500 to-emerald-700" // Tail

    // Body segments with gradient
    const gradientPosition = index / (length - 1)
    if (gradientPosition < 0.33) return "from-emerald-300 to-emerald-500"
    if (gradientPosition < 0.66) return "from-emerald-400 to-emerald-600"
    return "from-emerald-500 to-emerald-700"
  }

  // Update background music when sound setting changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (soundEnabled) {
        backgroundMusicRef.current.play().catch((e) => console.error("Audio play failed:", e))
      } else {
        backgroundMusicRef.current.pause()
      }
    }
  }, [soundEnabled])

  // Start background music when component mounts
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = 0.3 // Lower volume for background music
      backgroundMusicRef.current.loop = true

      // Play music if sound is enabled
      if (soundEnabled) {
        backgroundMusicRef.current.play().catch((e) => console.error("Audio play failed:", e))
      }
    }

    return () => {
      // Cleanup - pause music when component unmounts
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white overflow-hidden p-4">
      {/* Audio elements */}
      <audio ref={eatSoundRef} src="/anime-wow-sound-effect.mp3" preload="auto"></audio>
      <audio ref={gameOverSoundRef} src="/sochna-pdta-hai-re-hindustani-bhau.mp3" preload="auto"></audio>
      <audio ref={backgroundMusicRef} src="/retro-game-music-230227.mp3" preload="auto"></audio>

      {/* Header */}
      <motion.header
        className="w-full max-w-3xl mx-auto text-center py-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Snake Odyssey
        </h1>

        <div className="flex justify-center gap-4 mt-2">
          <Badge variant="outline" className="px-3 py-1 text-lg bg-gray-800/50 border-gray-700">
            <Trophy className="w-4 h-4 mr-1 text-yellow-400" />
            Score: {score}
          </Badge>

          <Badge variant="outline" className="px-3 py-1 text-lg bg-gray-800/50 border-gray-700">
            <Trophy className="w-4 h-4 mr-1 text-amber-500" />
            Best: {highScore}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className="h-8 w-8 rounded-full bg-gray-800/50 border border-gray-700"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-green-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </motion.header>

      {/* Game Board */}
      <motion.div
        className="relative grid bg-opacity-20 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${gameBoardSize}, 1fr)`,
          width: "min(90vw, 600px)",
          height: "min(90vw, 600px)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-blue-500/10 pointer-events-none"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Grid Cells */}
        {Array.from({ length: gameBoardSize * gameBoardSize }).map((_, i) => {
          const x = i % gameBoardSize
          const y = Math.floor(i / gameBoardSize)

          // Check if this cell is part of the snake
          const snakeIndex = snake.findIndex((segment) => segment.x === x && segment.y === y)
          const isSnake = snakeIndex !== -1
          const isFood = food.x === x && food.y === y
          const isHead = snakeIndex === 0

          return (
            <div
              key={i}
              className={cn(
                "border border-gray-800/30 transition-all duration-75",
                isSnake && "scale-[1.05] shadow-md z-10",
                isFood && "rounded-full shadow-lg z-20",
              )}
            >
              {isSnake && (
                <motion.div
                  className={cn("w-full h-full bg-gradient-to-br rounded-sm", getCellColor(snakeIndex, snake.length))}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  {isHead && direction === "RIGHT" && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black"></div>
                  )}
                  {isHead && direction === "LEFT" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black"></div>
                  )}
                  {isHead && direction === "UP" && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black"></div>
                  )}
                  {isHead && direction === "DOWN" && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black"></div>
                  )}
                </motion.div>
              )}

              {isFood && (
                <motion.div
                  className="w-full h-full bg-red-500 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <div className="absolute top-1/4 right-1/4 w-1/4 h-1/4 rounded-full bg-white/30"></div>
                </motion.div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Mobile Controls */}
      <motion.div
        className="grid grid-cols-3 gap-2 mt-6 md:hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: gameActive ? 1 : 0, y: gameActive ? 0 : 50 }}
        transition={{ duration: 0.5 }}
      >
        <div></div>
        <Button
          variant="outline"
          className="p-3 aspect-square rounded-full bg-gray-800/50 border-gray-700"
          onClick={() => direction !== "DOWN" && setDirection("UP")}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <div></div>

        <Button
          variant="outline"
          className="p-3 aspect-square rounded-full bg-gray-800/50 border-gray-700"
          onClick={() => direction !== "RIGHT" && setDirection("LEFT")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="p-3 aspect-square rounded-full bg-gray-800/50 border-gray-700"
          onClick={() => direction !== "UP" && setDirection("DOWN")}
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="p-3 aspect-square rounded-full bg-gray-800/50 border-gray-700"
          onClick={() => direction !== "LEFT" && setDirection("RIGHT")}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Start Game Modal */}
      <AnimatePresence>
        {!gameActive && !gameOver && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="w-[90vw] max-w-md bg-gray-900 border-green-500/50 text-white">
                <CardContent className="pt-6 flex flex-col items-center">
                  <motion.div
                    animate={{
                      rotate: [0, 10, 0, -10, 0],
                      y: [0, -5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="mb-4"
                  >
                    <Snake className="w-24 h-24 text-green-400" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                    Snake Odyssey
                  </h2>

                  <p className="text-gray-300 mb-6 text-center">
                    Navigate the snake to eat apples and grow longer. Don't hit yourself!
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Gamepad2 className="w-5 h-5 text-green-400" />
                      <span>Arrow keys or swipe</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Apple className="w-5 h-5 text-red-400" />
                      <span>Eat to grow</span>
                    </div>
                  </div>

                  <Button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg mt-2"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start Game
                  </Button>

                  {highScore > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-amber-400">
                      <Trophy className="w-5 h-5" />
                      <span>High Score: {highScore}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="w-[90vw] max-w-md bg-gray-900 border-red-500/50 text-white">
                <CardContent className="pt-6 flex flex-col items-center">
                  <motion.h2
                    className="text-4xl font-bold text-red-500 mb-2"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    Game Over
                  </motion.h2>

                  <div className="flex items-center gap-3 my-4">
                    <Badge variant="outline" className="px-3 py-1 text-lg bg-gray-800/50 border-gray-700">
                      <Trophy className="w-4 h-4 mr-1 text-yellow-400" />
                      Score: {score}
                    </Badge>

                    <Badge variant="outline" className="px-3 py-1 text-lg bg-gray-800/50 border-gray-700">
                      <Trophy className="w-4 h-4 mr-1 text-amber-500" />
                      Best: {highScore}
                    </Badge>
                  </div>

                  {score === highScore && score > 0 && (
                    <motion.div
                      className="mb-4 text-yellow-400 font-bold text-center"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      🏆 New High Score! 🏆
                    </motion.div>
                  )}

                  <Button
                    onClick={restartGame}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg mt-2"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Play Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.footer
        className="mt-6 text-center text-gray-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-sm">Use arrow keys or swipe to move. Eat food to grow!</p>
      </motion.footer>
    </div>
  )
}

