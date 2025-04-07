import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import "./QuizzApp.css";
import isMobile from './isMobile';
const socket = io('http://localhost:5000/');
const avatars = [
  "/avatars/ICON-01.jpg",
  "/avatars/ICON-02.jpg",
  "/avatars/ICON-03.jpg",
  "/avatars/ICON-04.jpg",
  "/avatars/ICON-05.jpg",
  "/avatars/ICON-06.jpg",
  "/avatars/ICON-07.jpg",
  "/avatars/ICON-08.jpg",
  "/avatars/ICON-09.jpg",
  "/avatars/ICON-10.jpg",
  "/avatars/ICON-11.jpg",
  "/avatars/ICON-12.jpg",
];
const QuizApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [room, setRoom] = useState(false);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [allowNext, setAllowNext] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showQuestionCorrect, setshowQuestionCorrect] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [avatar, setAvatar] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [userAnswer, setUserAnswer] = useState(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [typedAnswer, setTypedAnswer] = useState('');

  const correctAnswer = currentQuestion?.correct;
  const [time, setTime] = useState(30);
  const handleJoin = () => {
    if (!avatar) return alert("Vui lòng chọn avatar!");
    if (!name.trim()) return alert("Vui lòng nhập tên!");

    setRoom(true);
    socket.emit("join", { name, avatar });
  };
  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [time]);
  const handleAnswer = (answer) => {
    // Chuẩn hóa đáp án người chơi (chuyển thành chữ thường và loại bỏ khoảng trắng)
    const normalizedAnswer = answer.trim().toLowerCase();
    
    // Gửi đáp án chuẩn hóa lên server
    setSelectedAnswer(normalizedAnswer);
    socket.emit('answer', { name, answer: normalizedAnswer });
  };
  

  const handleNext = () => {
    if (allowNext) {
      setSelectedAnswer('');
      setTypedAnswer('');
      socket.emit('nextQuestion');
    }
  };

  const handleAdminLogin = (password) => {
    if (password === 'Poly123') setAdmin(true);
  };

  const handleReset = () => {
    socket.emit('resetGame');
    setTypedAnswer('');
    setTime(30);
  };

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    socket.on('players', (players) => setPlayers(players));

    socket.on('startGame', (newQuestion) => {
      setGameStarted(true);
      setShowResult(false);
      setQuestion(newQuestion);
      setshowQuestionCorrect(false);
      setAllowNext(false);
      setQuestionIndex(0);
      setTime(30);
      setTypedAnswer('');
    });

    socket.on('nextQuestion', (newQuestion) => {
      setshowQuestionCorrect(true);
      setAllowNext(false);
      setSelectedAnswer('');
      setTypedAnswer('');
      setTimeout(() => {
        setshowQuestionCorrect(false);
        setQuestion(newQuestion);
        setQuestionIndex((prev) => prev + 1);
      }, 2000);
      setTime(32);
    });
    
    socket.on("questionStats", ({ totalCorrect, totalWrong, correctAnswer, playerAnswers }) => {
      const user = playerAnswers.find((player) => player.name === name);
      const normalizedCorrectAnswer = correctAnswer?.trim().toLowerCase();  
      setUserAnswer(user ? user.answer : "Chưa trả lời");
      setTypedAnswer('');
      setTotalCorrect(totalCorrect);
      setTotalWrong(totalWrong);
      setCurrentQuestion(correctAnswer);

      setshowQuestionCorrect(true);
    });

    socket.on('finish', () => {
      setshowQuestionCorrect(false);
      setShowResult(true);
      setTimeout(() => {

      }, 2000);
    });

    socket.on('resetGame', () => {
      setPlayers([]);
      setQuestion(null);
      setAllowNext(false);
      setGameStarted(false);
      setShowResult(false);
      setTypedAnswer('');
      setRoom(false);
      setName('');
      setScore(0);
      setSelectedAnswer('');
      setQuestionIndex(0);
    });

    return () => {
      clearTimeout(introTimer);
      socket.off('players');
      socket.off('startGame');
      socket.off('nextQuestion');
      socket.off('finish');
      socket.off('resetGame');
    };
  }, []);

  return (
    <>
      {/* Hiển thị màn hình nền nếu showIntro === true */}
      {showIntro ? (
        <div className="intro-screen">

        </div>
      ) : (
        <div style={{ padding: '0px', textAlign: 'center', maxHeight: '100vh', overflowY: 'auto' }}>
          {
            location.pathname === '/admin' ?
              (
                !admin ? (
                  <>
              
           <Input.Password
             placeholder="Mật khẩu Admin"
             onPressEnter={(e) => handleAdminLogin(e.target.value)}
             style={{ width: 400, marginTop: '20px' }}
           />
           </>
                ) : (
                  <Card style={{ width: 400, margin: '0 auto', padding: '20px' }}>
                    <h1>Admin Control</h1>
               
            
                    {!gameStarted ? (
                      <>
                        <Button type="primary" onClick={() => socket.emit('startGame')}>
                          Bắt đầu
                        </Button>
                        <Button type="danger" onClick={handleReset}>Reset</Button>
                      </>
                    ) : (
                      <>
                      {time <= 28 || time >= 39 ? (
                        <>
                          <Button
                            type="primary"
                            onClick={() => socket.emit("nextQuestion")}
                            style={{ marginBottom: "10px" }}
                          >
                            Cho phép tiếp tục
                          </Button>
                        
                        </>
                      ) : null} {/* Ẩn khi 1 < time < 39 */} 
                       <Button type="danger" onClick={handleReset}>Reset</Button>
                    </>
                    
                    )}

                    {players.length > 0 && (
                      <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '10px' }}>
                        <h3>🏆 Bảng xếp hạng</h3>
                        <ul>
                          {players
                            .sort((a, b) => {
                              if (b.score === a.score) {
                                return a.totalTime - b.totalTime; // Nếu điểm bằng nhau, ai nhanh hơn xếp trên
                              }
                              return b.score - a.score;
                            })
                            .map((player, index) => (
                              <li key={index}>
                                {index + 1}. {player.name} - {player.score} điểm - {(player.totalTime / 1000).toFixed(2)} giây
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}


                    <h3>Người chơi</h3>
                    <ul>
                      {players.map((player, index) => (
                        <li key={index}>{player.name} - Điểm: {player.score}</li>
                      ))}
                    </ul>
                  </Card>
                )
              ) : location.pathname === '/xephang' ? (
                <>
                  <Card className='quiz-app-point'>
                    <div className='quiz-app-xephang'>
                      <h3>🏆 Bảng xếp hạng</h3>
                      <div className='quiz-app-xephang-list'>
                        <ul style={{ padding: 0, margin: 0 }}>
                          {players
                            .sort((a, b) => {
                              if (b.score === a.score) {
                                return a.totalTime - b.totalTime;
                              }
                              return b.score - a.score;
                            })
                            .map((player, index) => (
                              <li key={index} >
                                {index === 0 && "🏆 "}
                                {index === 1 && "🥈 "}
                                {index === 2 && "🥉 "}
                                <img
                                  src={player.avatar}
                                  alt={`Avatar ${player.name}`}
                                  className="player-avatar-thongke"
                                  style={{ width: '30px', height: '30px', borderRadius: '50%', margin: '0 5px' }}
                                />
                                {player.name} - {player.score} điểm - {(player.totalTime / 1000).toFixed(2)} giây
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </>
              ) : !room ? (

                <div className='room'>
                  <Card className='card-room'>
                    <Input
                      placeholder="Nhập tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={20}
                      style={{ marginTop: '20px', backgroundColor: "#FAE5D2" }}
                    />
                    <h2>Chọn Avatar</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {avatars.map((avt, index) => (
                        <img
                          key={index}
                          src={avt}
                          alt={`Avatar ${index + 1}`}
                          className='avatar-room'
                          style={{
                            border: avatar === avt ? '4px solid blue' : '2px solid gray',
                          }}
                          onClick={() => setAvatar(avt)}
                        />
                      ))}
                    </div>
                    <Button type="primary" onClick={handleJoin} style={{ marginTop: '20px', backgroundColor: "#1F2257" }}>
                      Vào phòng chờ
                    </Button>
                  </Card>
                </div>
              ) : !gameStarted ? (
                <Card className="waiting-room-card">
                  {!isMobile() ? (
                    <div className="room-card">
                      <br />
                      <h2>Phòng chờ</h2>
                      <ul className="player-list">
                        {players.slice().reverse().slice(0, 15).map((player, index) => (
                          <li key={index} className="player-item">
                            <img src={player.avatar} alt={`Avatar ${player.name}`} className="player-avatar" />
                            <span className="player-name">{player.name}</span>
                          </li>
                        ))}
                        {players.length > 15 && (
                          <li className="player-item placeholder itemwaiting">
                            <span>+{players.length - 15}</span>
                          </li>
                        )}
                      </ul>
                      <p className="waiting-message">Vui lòng chờ Admin bắt đầu!</p>
                    </div>

                  ) : (
                    <div className="room-card">
                      <h2>Phòng chờ</h2>
                      <ul className="player-list">
                        {players.slice().reverse().slice(0, 9).map((player, index) => (
                          <li key={index} className="player-item">
                            <img src={player.avatar} alt={`Avatar ${player.name}`} className="player-avatar" />
                            <span className="player-name">{player.name}</span>
                          </li>
                        ))}
                        {players.length > 9 && (
                          <li className="player-item placeholder itemwaiting">
                            <span>+{players.length - 9}</span>
                          </li>
                        )}
                      </ul>
                      <p className="waiting-message">Vui lòng chờ Admin bắt đầu!</p>
                    </div>
                  )}
                </Card>


              ) : showQuestionCorrect ? (
                <Card className="quiz-app-point">

                  <p>Đáp án đúng: <strong style={{ color: "green" }}>{currentQuestion}</strong></p>
                  <p>Số người chọn đúng: {totalCorrect}</p>
                  <p>Số người chọn sai: {totalWrong}</p>
                </Card>
              ) : showResult ? (
                <Card className='quiz-app-point'>
                  <div className='quiz-app-xephang'>
                    <h3>🏆 Bảng xếp hạng</h3>
                    <div className='quiz-app-xephang-list'>
                      <ul style={{ padding: 0, margin: 0 }}>
                        {players
                          .sort((a, b) => {
                            if (b.score === a.score) {
                              return a.totalTime - b.totalTime;
                            }
                            return b.score - a.score;
                          })
                          .map((player, index) => (
                            <li key={index} >
                              {index === 0 && "🏆 "}
                              {index === 1 && "🥈 "}
                              {index === 2 && "🥉 "}
                              <img
                                src={player.avatar}
                                alt={`Avatar ${player.name}`}
                                className="player-avatar-thongke"
                                style={{ width: '30px', height: '30px', borderRadius: '50%', margin: '0 5px' }}
                              />
                              {player.name} - {player.score} điểm - {(player.totalTime / 1000).toFixed(2)} giây
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ) :
                (
                  <div className="quiz-app-question">
                  <Card className="quiz-app-question-question">
                    {/* Hiển thị câu hỏi */}
                    <h1
                      dangerouslySetInnerHTML={{
                        __html: question?.question.replace(/\n/g, "<br />") .replace(/bold/g, "<b>bold</b>")
                        .replace(/ioorinfmatn/g, "<b>ioorinfmatn</b>") || "Đang tải câu hỏi...",
                      }}
                    />
                
                    {/* Hiển thị hình ảnh nếu có */}
                    {question?.image && (
                      <div className="imgquestion">
                        <img
                          src={question.image}
                          alt="Câu hỏi hình ảnh"
                          style={{
                            maxHeight: "250px",
                            height: "100%",
                            maxWidth: "500px",
                            width: "100%",
                            borderRadius: "10px",
                            marginBottom: "10px",
                          }}
                        />
                      </div>
                    )}
                
                    {/* Hiển thị âm thanh nếu có */}
                    {question?.audio && (
                      <audio controls style={{ width: "100%", marginBottom: "10px" }}>
                        <source src={question.audio} type="audio/mpeg" />
                        Trình duyệt của bạn không hỗ trợ phát âm thanh.
                      </audio>
                    )}
                
                    {/* Hiển thị video nếu có */}
                    {question?.video && (
                      <div className="video-container" style={{ textAlign: "center", marginBottom: "10px" }}>
                        <video controls style={{ maxWidth: "80%", borderRadius: "10px" }}>
                          <source src={question.video} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ phát video.
                        </video>
                      </div>
                    )}
                
                    {/* Nếu có options thì hiển thị nút lựa chọn */}
                    {question?.options && question.options.length > 0 ? (
                      question.options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => handleAnswer(option)}
                          disabled={!!selectedAnswer}
                          style={{
                            margin: "10px",
                            background: selectedAnswer === option ? "#FFB400" : "#FFD580",
                            color: selectedAnswer === option ? "#6A3E19" : "#3A1D00",
                            border: selectedAnswer === option ? "3px solid #6A3E19" : "1px solid #D9D9D9",
                            fontWeight: selectedAnswer === option ? "bold" : "normal",
                            cursor: selectedAnswer ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease-in-out",
                            opacity: selectedAnswer && selectedAnswer !== option ? 0.5 : 1,
                          }}
                        >
                          <div className="answer-option"> {option
          .replace("france, england and mexico", "France, England and Mexico") // Thay "america, canada and mexico" thành "âcm"
          .replace("america, canada and mexico", "America, Canada and Mexico")
          .replace("russia, canada and ameria", "Russia, Canada and Ameria")
          .replace("indonesia, korea and china", "Indonesia, Korea and China")
          } </div>
                        </Button>
                      ))
                    ) : (
                      <div style={{ marginTop: "20px" }}>
                    <input
  type="number"
  value={typedAnswer}
  onChange={(e) => setTypedAnswer(e.target.value.toUpperCase())}  
  disabled={!!selectedAnswer}
  placeholder="Nhập đáp án của bạn..."
  style={{
    width: "80%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "10px",
  }}
/>

                        <Button
                          onClick={() => handleAnswer(typedAnswer)}
                          disabled={!!selectedAnswer || !typedAnswer.trim()}
                          style={{
                            background: "#FFD580",
                            color: "#3A1D00",
                            border: "1px solid #D9D9D9",
                            fontWeight: "bold",
                            width: "100%",
                          }}
                        >
                          Gửi
                        </Button>
                      </div>
                    )}
                
                    {/* Nút "Câu tiếp theo" */}
                    {allowNext && (
                      <Button type="primary" onClick={handleNext} style={{ marginTop: "20px" }}>
                        Câu tiếp theo
                      </Button>
                    )}
                  </Card>
                </div>
                

                )}

        </div>
      )}
    </>

  );
};

export default QuizApp;
