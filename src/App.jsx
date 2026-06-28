import { useState, useEffect } from "react"
import { supabase } from "./supabase"

// ===== 彈窗廣告圖片清單（不包含 ad-banner.png）=====
const AD_IMAGES = [
  "/ad-2.JPG",
  "/ad-3.JPG",
]

// ===== 廣告位元件（只在登入頁頂部顯示）=====
const AdBanner = () => (
  <div className="w-full overflow-hidden">
    <img
      src="/ad-banner.png"
      alt="廣告"
      className="w-full object-cover"
    />
  </div>
)

// ===== 彈窗廣告元件 =====
const AdModal = ({ onClose }) => {
  const [randomImage] = useState(
    () => AD_IMAGES[Math.floor(Math.random() * AD_IMAGES.length)]
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
        >
          ✕
        </button>
        <img
          src={randomImage}
          alt="廣告"
          className="w-full object-cover"
        />
      </div>
    </div>
  )
}

// ===== 課程卡片元件 =====
const CourseCard = ({ course, onVideoPlayed }) => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
    <div className="w-full aspect-video">
      {course.video_url ? (
        <iframe
          src={`https://www.youtube.com/embed/${course.video_url}`}
          title={course.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onFocus={onVideoPlayed}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <p className="text-gray-400 text-sm">功能尚未完成，敬請期待。</p>
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="text-base font-bold text-gray-800 mb-1">{course.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{course.description}</p>
    </div>
  </div>
)

export default function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ name: "", phone: "" })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState("auth")
  const [currentUser, setCurrentUser] = useState(null)
  const [countdown, setCountdown] = useState(2)
  const [activeTab, setActiveTab] = useState("profile")
  const [jugglingCourses, setJugglingCourses] = useState([])
  const [physioCourses, setPhysioCourses] = useState([])
  const [showAd, setShowAd] = useState(false)
  const [videoClickCount, setVideoClickCount] = useState(0)
  const [adTriggerCount] = useState(() => Math.floor(Math.random() * 3) + 2)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (videoClickCount > 0 && videoClickCount % adTriggerCount === 0) {
      setShowAd(true)
    }
  }, [videoClickCount])

  const handleVideoPlayed = () => {
    setVideoClickCount(prev => prev + 1)
  }

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("order_num")

    if (!error && data) {
      setJugglingCourses(data.filter(c => c.category === "juggling"))
      setPhysioCourses(data.filter(c => c.category === "physio"))
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async () => {
    const { error } = await supabase
      .from("users")
      .insert([{ name: formData.name, phone: formData.phone }])
    if (error) {
      setMessage("註冊失敗：" + (error.message.includes("unique") ? "此電話號碼已被註冊" : error.message))
    } else {
      setMessage("註冊成功！請直接登入")
      setIsLogin(true)
    }
  }

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", formData.phone)
      .eq("status", "active")
      .single()

    if (error || !data) {
      setMessage("登入失敗：查無此電話號碼或帳號已停用")
    } else {
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("phone", formData.phone)

      setCurrentUser(data)
      setCountdown(2)
      setMessage(`歡迎回來，${data.name}！`)

      let count = 2
      const timer = setInterval(() => {
        count -= 1
        setCountdown(count)
        if (count === 0) {
          clearInterval(timer)
          setPage("home")
          setMessage("")
          // 登入後立刻彈出廣告
          setShowAd(true)
        }
      }, 1000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    if (isLogin) {
      await handleLogin()
    } else {
      await handleRegister()
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setFormData({ name: "", phone: "" })
    setPage("auth")
    setIsLogin(true)
    setActiveTab("profile")
    setVideoClickCount(0)
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    window.scrollTo(0, 0)
  }

  // ===== 個人畫面 =====
  const ProfilePage = () => (
    <div className="p-4 pt-6">
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          歡迎回來，{currentUser?.name}
        </h2>
        <p className="text-gray-400 text-sm">
          帳號狀態：
          <span className={`ml-1 font-medium ${currentUser?.status === "active" ? "text-green-500" : "text-red-500"}`}>
            {currentUser?.status === "active" ? "正常" : "已停用"}
          </span>
        </p>
      </div>
      <div className="space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">電話號碼</p>
          <p className="text-base font-semibold text-gray-800">{currentUser?.phone}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">會員等級</p>
          <p className="text-base font-semibold text-gray-800">
            {currentUser?.role === "admin" ? "管理員" :
             currentUser?.role === "vip" ? "VIP 會員" : "一般會員"}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">加入時間</p>
          <p className="text-base font-semibold text-gray-800">
            {new Date(currentUser?.created_at).toLocaleDateString("zh-TW")}
          </p>
        </div>
      </div>
    </div>
  )

  // ===== 雜耍訓練頁面 =====
  const JugglingPage = () => (
    <div className="p-4 pt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">雜耍訓練課程</h2>
      {jugglingCourses.length > 0 ? (
        jugglingCourses.map(course => (
          <CourseCard key={course.id} course={course} onVideoPlayed={handleVideoPlayed} />
        ))
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-400 text-sm text-center">功能尚未完成，敬請期待。</p>
        </div>
      )}
    </div>
  )

  // ===== 物理治療頁面 =====
  const PhysioPage = () => (
    <div className="p-4 pt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">物理治療課程</h2>
      {physioCourses.length > 0 ? (
        physioCourses.map(course => (
          <CourseCard key={course.id} course={course} onVideoPlayed={handleVideoPlayed} />
        ))
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-gray-400 text-sm text-center">功能尚未完成，敬請期待。</p>
        </div>
      )}
    </div>
  )

  // ===== 主畫面 =====
  if (page === "home") {
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        {showAd && <AdModal onClose={() => setShowAd(false)} />}
        <nav className="bg-white shadow-sm px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-base font-bold text-gray-800">Juggling</h1>
          <button onClick={handleLogout} className="text-sm text-red-500">
            登出
          </button>
        </nav>
        {activeTab === "profile" && <ProfilePage />}
        {activeTab === "juggling" && <JugglingPage />}
        {activeTab === "physio" && <PhysioPage />}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex pb-safe">
          <button
            onClick={() => switchTab("profile")}
            className={`flex-1 py-5 flex flex-col items-center gap-1 text-xs font-medium transition-colors
              ${activeTab === "profile" ? "text-blue-500 border-t-2 border-blue-500" : "text-gray-400"}`}
          >
            個人畫面
          </button>
          <button
            onClick={() => switchTab("juggling")}
            className={`flex-1 py-5 flex flex-col items-center gap-1 text-xs font-medium transition-colors
              ${activeTab === "juggling" ? "text-blue-500 border-t-2 border-blue-500" : "text-gray-400"}`}
          >
            雜耍訓練
          </button>
          <button
            onClick={() => switchTab("physio")}
            className={`flex-1 py-5 flex flex-col items-center gap-1 text-xs font-medium transition-colors
              ${activeTab === "physio" ? "text-blue-500 border-t-2 border-blue-500" : "text-gray-400"}`}
          >
            物理治療
          </button>
        </div>
      </div>
    )
  }

  // ===== 登入/註冊頁 =====
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start px-4 pt-0">
      <div className="w-full max-w-md">
        <AdBanner />
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md mt-6 mb-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {isLogin ? "會員登入" : "會員註冊"}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          {isLogin ? "請輸入您的電話號碼登入" : "請填寫以下資料完成註冊"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">姓名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="請輸入您的姓名"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">電話號碼</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="例如：0912345678"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {message && (
            <div className={`text-sm text-center ${message.includes("失敗") ? "text-red-500" : "text-green-500"}`}>
              <p>{message}</p>
              {!message.includes("失敗") && isLogin && countdown > 0 && (
                <p className="text-4xl font-bold mt-2">{countdown}</p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || (isLogin && countdown < 2 && countdown > 0)}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors text-base"
          >
            {loading ? "處理中..." : (isLogin ? "登入" : "註冊")}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "還沒有帳號？" : "已經有帳號？"}
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage("") }}
            className="text-blue-500 hover:underline ml-1"
          >
            {isLogin ? "立即註冊" : "前往登入"}
          </button>
        </p>
      </div>
    </div>
  )
}