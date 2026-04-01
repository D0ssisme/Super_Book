"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { bookServices } from "@/services/bookServices";
import { Book } from "@/types/book.type";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  books?: Book[];
  showQuestions?: boolean;
}

const QUICK_QUESTIONS = [
  { id: 1, text: "📚 Sách bán chạy nhất" },
  { id: 2, text: "👋 Chào bạn" },
  { id: 3, text: "❓ Tôi có thể giúp gì?" },
];

// Generate unique ID to avoid React key warnings
const generateUniqueId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! 👋 Tôi là trợ lý sách của bạn. Chọn một câu hỏi bên dưới hoặc nhắn tin với tôi!",
      sender: "bot",
      timestamp: new Date(),
      showQuestions: true,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBestSellingBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/best-selling");
      const books = response.data.data || [];

      const botMessage: Message = {
        id: generateUniqueId(),
        text: `Đây là ${books.length} cuốn sách bán chạy nhất trên hệ thống:`,
        sender: "bot",
        timestamp: new Date(),
        books: books,
        showQuestions: true,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching best-selling books:", error);
      const errorMessage: Message = {
        id: generateUniqueId(),
        text: "Xin lỗi, tôi không thể lấy danh sách sách bán chạy. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: new Date(),
        showQuestions: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (questionId: number) => {
    let messageText = "";
    
    if (questionId === 1) {
      messageText = "Sách bán chạy nhất";
    } else if (questionId === 2) {
      messageText = "Xin chào";
    } else if (questionId === 3) {
      messageText = "Tôi có thể giúp gì?";
    }

    // Add user message
    const userMessage: Message = {
      id: generateUniqueId(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [
      prev.filter(m => !m.showQuestions),
      userMessage
    ].flat() as Message[]);

    // Auto-respond based on question
    if (questionId === 1) {
      await fetchBestSellingBooks();
    } else if (questionId === 2) {
      const greeting: Message = {
        id: generateUniqueId(),
        text: "Chào bạn! 😊 Bạn có thể hỏi tôi về sách bán chạy, hoặc tìm sách yêu thích của mình. Hãy nói với tôi bạn muốn tìm gì!",
        sender: "bot",
        timestamp: new Date(),
        showQuestions: true,
      };
      setMessages((prev) => [...prev, greeting]);
    } else if (questionId === 3) {
      const response: Message = {
        id: generateUniqueId(),
        text: "Bạn có thể hỏi tôi về 'sách bán chạy' để xem những cuốn sách được yêu thích nhất. 📚",
        sender: "bot",
        timestamp: new Date(),
        showQuestions: true,
      };
      setMessages((prev) => [...prev, response]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: generateUniqueId(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) =>
      prev.map(m => m.showQuestions ? { ...m, showQuestions: false } : m)
    );
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Check for keyword triggers
    const lowerInput = inputValue.toLowerCase();

    if (
      lowerInput.includes("sách bán chạy") ||
      lowerInput.includes("bán chạy") ||
      lowerInput.includes("popular") ||
      lowerInput.includes("best selling")
    ) {
      await fetchBestSellingBooks();
    } else if (
      lowerInput.includes("xin chào") ||
      lowerInput.includes("hello") ||
      lowerInput.includes("hi")
    ) {
      const greeting: Message = {
        id: generateUniqueId(),
        text: "Chào bạn! 😊 Bạn có thể hỏi tôi về sách bán chạy, hoặc tìm sách yêu thích của mình. Hãy nói với tôi bạn muốn tìm gì!",
        sender: "bot",
        timestamp: new Date(),
        showQuestions: true,
      };
      setMessages((prev) => [...prev, greeting]);
    } else {
      const response: Message = {
        id: generateUniqueId(),
        text: "Bạn có thể hỏi tôi về 'sách bán chạy' để xem những cuốn sách được yêu thích nhất. 📚",
        sender: "bot",
        timestamp: new Date(),
        showQuestions: true,
      };
      setMessages((prev) => [...prev, response]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Trợ lý sách 📚</h3>
              <p className="text-xs text-blue-100">Luôn sẵn sàng giúp bạn</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id}>
                {message.sender === "bot" ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm shadow-sm">
                        {message.text}
                      </div>
                      {message.books && message.books.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.books.slice(0, 3).map((book) => (
                            <a
                              key={book._id}
                              href={`/books/${book._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex gap-2 bg-white p-2 rounded-lg hover:bg-purple-50 transition text-xs"
                            >
                              <img
                                src={book.mainImage}
                                alt={book.name}
                                className="w-12 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {book.name}
                                </p>
                                <p className="text-purple-600 font-bold">
                                  {book.price?.toLocaleString()}đ
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                      {message.showQuestions && (
                        <div className="mt-3 flex flex-col gap-2">
                          {QUICK_QUESTIONS.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => handleQuickQuestion(q.id)}
                              disabled={loading}
                              className="w-full text-left bg-blue-50 hover:bg-blue-100 text-gray-800 px-3 py-2 rounded-lg text-sm transition disabled:opacity-50 border border-blue-200"
                            >
                              {q.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm max-w-xs">
                      {message.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-center">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t p-3 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhắn tin..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
