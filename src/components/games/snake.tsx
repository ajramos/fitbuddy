'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // Used for sizing calculations logic generally, though CSS grid handles rendering
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: 0 };
const SPEED = 150;

type Point = { x: number; y: number };

export default function SnakeGame() {
    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
    const [food, setFood] = useState<Point>({ x: 15, y: 5 });
    const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const directionRef = useRef(INITIAL_DIRECTION);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    const generateFood = useCallback((): Point => {
        return {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }, []);

    const resetGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        directionRef.current = INITIAL_DIRECTION;
        setFood(generateFood());
        setGameOver(false);
        setScore(0);
        setIsPaused(true);
    };

    const startGame = (initialDir: Point = { x: 0, y: -1 }) => {
        if (gameOver) resetGame();
        setDirection(initialDir);
        setIsPaused(false);
    };

    const handleRestart = () => {
        resetGame();
        // Small delay to ensure state reset before starting? 
        // Actually, just setting paused=false with reset state effectively starts next tick if we had auto-start,
        // but here we wait for input usually. 
        // User said "click to continue".
        // Let's make it start moving UP by default on click if just "starting".
        if (gameOver) {
            setSnake(INITIAL_SNAKE);
            setFood(generateFood());
            setGameOver(false);
            setScore(0);
            setDirection({ x: 0, y: -1 }); // Start moving up
            setIsPaused(false);
        } else if (isPaused) {
            setDirection({ x: 0, y: -1 });
            setIsPaused(false);
        }
    };

    const moveSnake = useCallback(() => {
        if (isPaused || gameOver) return;

        // Don't move if direction is 0,0
        if (directionRef.current.x === 0 && directionRef.current.y === 0) return;

        setSnake((prevSnake) => {
            const head = prevSnake[0];
            const newHead = {
                x: head.x + directionRef.current.x,
                y: head.y + directionRef.current.y
            };

            // Check collisions with walls
            if (
                newHead.x < 0 || newHead.x >= GRID_SIZE ||
                newHead.y < 0 || newHead.y >= GRID_SIZE
            ) {
                setGameOver(true);
                return prevSnake;
            }

            // Check collisions with self
            if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                setGameOver(true);
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Check food
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore(s => s + 1);
                setFood(generateFood());
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [isPaused, gameOver, food, generateFood]);

    // Game Loop
    useEffect(() => {
        const interval = setInterval(moveSnake, SPEED);
        return () => clearInterval(interval);
    }, [moveSnake]);

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent scrolling with arrows
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }

            if (gameOver) {
                // Any arrow key restarts
                if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                    handleRestart();
                }
                return;
            }

            const current = directionRef.current;

            // If paused (start of game), any arrow starts it
            if (isPaused && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                setIsPaused(false);
            }

            switch (e.key) {
                case 'ArrowUp':
                    if (current.y === 0) setDirection({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                    if (current.y === 0) setDirection({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                    if (current.x === 0) setDirection({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                    if (current.x === 0) setDirection({ x: 1, y: 0 });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameOver, isPaused]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-xl animate-in fade-in duration-500 max-w-sm mx-auto">
            <div className="flex justify-between w-full mb-4 items-center px-2">
                <div className="text-slate-500 font-mono text-xs uppercase tracking-widest">Puntuación</div>
                <div className="text-2xl font-mono font-bold text-slate-800">{score}</div>
            </div>

            <div
                className="relative bg-slate-900 rounded-lg shadow-inner overflow-hidden border-4 border-slate-800 cursor-pointer group"
                onClick={handleRestart}
                style={{
                    width: GRID_SIZE * CELL_SIZE,
                    height: GRID_SIZE * CELL_SIZE,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
            >
                {/* Overlay for Start/Game Over */}
                {(isPaused || gameOver) && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 text-center p-6 backdrop-blur-[2px] transition-all group-hover:bg-black/60">
                        {gameOver ? (
                            <>
                                <div className="text-3xl font-bold mb-2 text-rose-500 font-mono">¡HAS PERDIDO!</div>
                                <div className="text-white/80 mb-6 font-mono text-sm">Puntuación Final: {score}</div>
                                <div className="text-xs text-white bg-white/20 px-4 py-2 rounded-full animate-pulse font-bold tracking-wide">
                                    Toca para reintentar ↺
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold mb-2 text-emerald-400 font-mono tracking-widest">SNAKE</div>
                                <div className="text-xs text-slate-300 max-w-[150px] leading-relaxed">
                                    Usa las flechas para comer y crecer.
                                </div>
                                <div className="mt-4 text-xs text-emerald-400/80 animate-pulse border-b border-emerald-400/30 pb-0.5">
                                    Toca para empezar
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Grid Rendering */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);

                    const isHead = snake[0].x === x && snake[0].y === y;
                    const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;

                    // Improved visual style
                    let cellClass = 'bg-transparent transition-all duration-100';
                    if (isHead) cellClass = 'bg-emerald-400 rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10';
                    else if (isBody) cellClass = 'bg-emerald-600 rounded-sm scale-95';
                    else if (isFood) cellClass = 'bg-rose-500 rounded-full scale-75 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';

                    return (
                        <div key={i} className={cellClass} />
                    );
                })}
            </div>

            {/* Mobile Controls - Simplified */}
            <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-[200px]">
                <div />
                <button
                    onClick={(e) => { e.stopPropagation(); setDirection({ x: 0, y: -1 }); setIsPaused(false); }}
                    className="aspect-square bg-slate-100 rounded-xl active:bg-blue-100 active:text-blue-600 flex items-center justify-center transition shadow-sm hover:bg-slate-50"
                >
                    <ArrowUp size={24} className="text-slate-400" />
                </button>
                <div />

                <button
                    onClick={(e) => { e.stopPropagation(); setDirection({ x: -1, y: 0 }); setIsPaused(false); }}
                    className="aspect-square bg-slate-100 rounded-xl active:bg-blue-100 active:text-blue-600 flex items-center justify-center transition shadow-sm hover:bg-slate-50"
                >
                    <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleRestart(); }}
                    className="aspect-square bg-slate-50 rounded-xl active:bg-slate-200 flex items-center justify-center transition border border-slate-100"
                    title="Reiniciar"
                >
                    <RotateCcw size={18} className="text-slate-400" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setDirection({ x: 1, y: 0 }); setIsPaused(false); }}
                    className="aspect-square bg-slate-100 rounded-xl active:bg-blue-100 active:text-blue-600 flex items-center justify-center transition shadow-sm hover:bg-slate-50"
                >
                    <ArrowRight size={24} className="text-slate-400" />
                </button>

                <div />
                <button
                    onClick={(e) => { e.stopPropagation(); setDirection({ x: 0, y: 1 }); setIsPaused(false); }}
                    className="aspect-square bg-slate-100 rounded-xl active:bg-blue-100 active:text-blue-600 flex items-center justify-center transition shadow-sm hover:bg-slate-50"
                >
                    <ArrowDown size={24} className="text-slate-400" />
                </button>
                <div />
            </div>

            <p className="mt-4 text-[10px] text-slate-300 font-mono text-center">
                Usa el teclado o los botones
            </p>
        </div>
    );
}
