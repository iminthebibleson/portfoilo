"use client";

import SongRanking from "../components/other/SongRanking";
import CurrentActivity from "../components/other/CurrentActivity";
import Topography from "../components/other/Topography";
import DiscordInfo from "../components/other/DiscordInfo";
import FooterList from "../components/home/FooterList";

const tokens = {
  bg: "#121016",
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  textPrimary: "#ECE6F0",
  textSecondary: "#9C96A5",
  lime: "#C6FF6B",
  limeDark: "#1B2A0E",
  lavender: "#CBB8FF",
  lavenderDark: "#211A33",
};

function Squircle({ children, size = 56, style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30% 70% 62% 38% / 44% 33% 67% 56%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function ComingSoon() {
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: tokens.bg,
        color: tokens.textPrimary,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      className="px-4 py-8 md:px-12 md:py-14 w-full max-w-full overflow-hidden flex items-center justify-center"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }

        @keyframes blobDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes blobDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-25px, 25px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise-1 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) both; }
        .rise-2 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) 0.08s both; }

        .m3-btn {
          transition: transform 0.18s cubic-bezier(.2,.8,.2,1), filter 0.18s ease, background 0.18s ease;
        }
        .m3-btn:hover { transform: scale(1.035); filter: brightness(1.08); }
        .m3-btn:active { transform: scale(0.96); }

        .card-hover {
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1), border-color 0.25s ease;
        }
        .card-hover:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); }
      `}</style>

      {/* ambient dynamic-color blobs, same as homepage */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-8%",
          width: 420,
          height: 420,
          borderRadius: "9999px",
          background: tokens.lime,
          opacity: 0.16,
          filter: "blur(90px)",
          animation: "blobDrift 14s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: 460,
          height: 460,
          borderRadius: "9999px",
          background: tokens.lavender,
          opacity: 0.14,
          filter: "blur(100px)",
          animation: "blobDrift2 16s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <section className="mb-10 rise-1">
          <h1
            className="display-font text-center mb-10 text-4xl md:text-5xl"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Misc
          </h1>

          <div className="flex flex-wrap justify-center gap-3">
            <div className="join gap-2">
              <a
                href="/"
                style={{
                  background: tokens.surface,
                  backdropFilter: "blur(20px)",
                }}
                className="btn btn-ghost p-6 rounded-r-md rounded-l-[28px] join-item"
              >
                Home
              </a>

              <a
                href="/other"
                style={{
                  background: tokens.surface,
                  backdropFilter: "blur(20px)",
                }}
                className="btn btn-ghost p-6 rounded-l-md rounded-r-[28px] join-item btn-active btn-disabled"
              >
                This page
              </a>
            </div>
          </div>
        </section>

        {/* Cards */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">

           <div
  className="p-6 card-hover rise-2 md:col-span-2 relative overflow-hidden h-fit"
  style={{
    borderRadius: 28,
    background: tokens.surface,
    border: `1px solid ${tokens.surfaceBorder}`,
    backdropFilter: "blur(20px)",
  }}
>

  <DiscordInfo />

</div>
          {/* Status */}

          <div
            className="p-6"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="space-y-3">
              <h2 className="display-font text-2xl" style={{ fontWeight: 600 }}>
                Favorite Games
              </h2>

              <a
                href="#"
                className="group flex items-center  p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/dyinglight2.png" alt="" className="h-14 w-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Dying Light 2
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">
                    Love all there games lowk
                  </p>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/minecraft.png" alt="" className="h-14 w-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Minecraft Java/Bedrock
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">Cave go brrr</p>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/schedule1.png" alt="" className="h-14 w-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Schedule 1
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">Cops don't play man</p>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/weedshop3.webp" alt="" className="h-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Weed Shop 3
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">Love the grind</p>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/beamng.png" alt="" className="h-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Beam.NG
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">
                    Learned how to do hit-n-runs
                  </p>
                </div>
              </a>

              <a
                href="#"
                className="group flex items-center p-4 gap-4"
                style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <img src="/bo2.png" alt="" className="h-14 " />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    Call of Duty: Warzone/BO2/soon MW4
                  </h3>
                  <p className=" text-xs text-[#9C96A5]">
                    Can't wait for MW4 better be good
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Lets see */}

          <div
            className="p-6 card-hover  rise-2 md:row-span-2"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className=" items-start justify-between space-y-4">
                <h2
                  className="display-font text-2xl"
                  style={{ fontWeight: 600 }}
                >
                  Recommended Projects
                </h2>



                <div className="card shadow-sm" style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}>
                  <figure className="">
                    <img
                      src="/metrolist.png"
                      alt="MOOSIC"
                      className="w-30" />
                  </figure>
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">Metrolist</h2>
                    <p>My favorite new way of listening to all the music i listen to after getting banned from spotify a lot times</p>
                    <div className="card-actions">
                      <a
                      href="https://metrolist.cc"
                        style={{
                          background: tokens.surface,
                          backdropFilter: "blur(20px)",
                        }}
                        className="btn btn-ghost p-6 rounded-[28px] join-item "
                      >
                        Visit project
                      </a>
                    </div>
                  </div>
                </div>

                <div className="card shadow-sm" style={{
                  borderRadius: 28,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  backdropFilter: "blur(20px)",
                }}>
                  <figure className="">
                    <img
                      src="/equibop.png"
                      alt="MOOSIC"
                      className="w-30" />
                  </figure>
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">Equibop</h2>
                    <p>A fork of Vencord but has much more plugins</p>
                    <div className="card-actions">
                      <a
                      href="https://equibop.org"
                        style={{
                          background: tokens.surface,
                          backdropFilter: "blur(20px)",
                        }}
                        className="btn btn-ghost p-6 rounded-[28px] join-item "
                      >
                        Visit project
                      </a>
                    </div>
                  </div>
                </div>


                          <div className="divider">More later on</div>



            </div>
          </div>

          {/* Lets see */}


                        <div
  className="p-6 card-hover rise-2 md:row-span-2 relative h-100 md:h-full overflow-hidden "
  style={{
    borderRadius: 28,
    background: tokens.surface,
    border: `1px solid ${tokens.surfaceBorder}`,
    backdropFilter: "blur(20px)",
  }}
>
  <Topography />

</div>



          <div
            className="p-6 card-hover rise-2"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <SongRanking />
          </div>

         


          <div
            className="p-6 card-hover  rise-2 md:col-span-2"
            style={{
              borderRadius: 28,
              background: `linear-gradient(135deg, ${tokens.lavenderDark} 0%, ${tokens.limeDark} 120%)`,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex-row md:flex items-center justify-between w-full">
                          <h2
                            className="display-font md:text-left text-center md:mb-0 mb-4 text-2xl"
                            style={{ fontWeight: 600 }}
                          >
                            Contacts
                            <div
                              className=" text-sm"
                              style={{ color: tokens.textSecondary }}
                            >
                              Thanks to{" "}
                              <a href="https://lamp.delivery" className="link ">
                                Lamp.delivery
                              </a>{" "}
                              for the UI Idea!
                            </div>
                          </h2>
            
                        <FooterList />            
            
                        </div>
          </div>
        </div>
      </div>
    </main>
  );
}
