"use client";

import { ArrowRight } from "lucide-react";


const tokens = {
    surface: "rgba(255,255,255,0.055)",
    surfaceBorder: "rgba(255,255,255,0.09)",
    textPrimary: "#ECE6F0",
    textSecondary: "#9C96A5",
    fallbackA: "#C6FF6B",
    fallbackB: "#CBB8FF",
};

const steps = [
    {
        title: "Fortnite Status bot",
        description:
            "A Discord bot that can fetch Fortnite stats like users stats, game news, And more.",
        modalText:
            "A Discord bot that can fetch Fortnite stats like users stats, game news, And more.",
    },
    {
        title: "Ev.io Status bot",
        description:
            "Discord bot that fetches and shows users stats to a Discord bot.",
        modalText:
            "There used to be a active FPS shooter game that got me into coding. which made me got very info API fetching to the point I made 2 versions of the game bot but each got better and advanced code other time.",
    },
];

export default function ProjectsList() {
    return (
        <div className="join gap-2 w-full join-vertical mt-5">
            {steps.map((item, index) => (
                <div key={index}>
                    <button
                        onClick={() =>
                            (
                                document.getElementById(
                                    `modal_${index}`
                                ) as HTMLDialogElement
                            )?.showModal()
                        }
                        style={{
                            background: tokens.surface,
                            backdropFilter: "blur(20px)",
                        }}
                        className={`
      btn btn-ghost p-10 md:p-8 join-item w-full
      flex items-center justify-between
      text-left
      ${index === 0
                                ? "rounded-t-[28px] rounded-b-md"
                                : index === steps.length - 1
                                    ? "rounded-t-md rounded-b-[28px]"
                                    : "rounded-md"
                            }
    `}
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-base font-medium">
                                {item.title}
                            </span>

                            <span className="text-sm opacity-60 font-normal">
                                {item.description}
                            </span>
                        </div>

                        <ArrowRight size={22} className="opacity-60" />
                    </button>

                    <dialog id={`modal_${index}`} className="modal">
                        <div
                            className="modal-box"
                            style={{
                                borderRadius: 28,
                                background: tokens.surface,
                                border: `1px solid ${tokens.surfaceBorder}`,
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            <h3 className="font-bold text-lg">{item.title}</h3>

                            <p className="py-4">{item.modalText}</p>

                            <div className="modal-action">
                                <form method="dialog">
                                    <button
                                        style={{
                                            background: tokens.surface,
                                            backdropFilter: "blur(20px)",
                                        }}
                                        className="btn btn-ghost p-6 rounded-[28px]"
                                    >
                                        Close
                                    </button>
                                </form>
                            </div>
                        </div>
                    </dialog>
                </div>
            ))}
        </div>
    );
}
