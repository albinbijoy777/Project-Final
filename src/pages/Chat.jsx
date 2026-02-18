import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

export default function Chat() {
  const { bookingId } = useParams();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [bookingId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at");

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: user.id,
      sender_role: profile.role,
      message: text,
    });

    setText("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col h-[80vh]">
      <h1 className="text-xl font-bold mb-4">Chat</h1>

      <div className="flex-1 overflow-y-auto border rounded p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded max-w-xs ${
              m.sender_id === user.id
                ? "bg-yellow-200 ml-auto"
                : "bg-gray-200"
            }`}
          >
            <p className="text-sm">{m.message}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-yellow-400 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
