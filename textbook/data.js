const textbookData = [
  {
    id: 1,
    title: "第1項目",
    description: "安全確認をしてから発進する。周囲を確認し、信号や標識を守って動き出すことが基本です。",
    sections: [
      {
        key: "tip",
        label: "教官ワンポイント",
        japanese: "一度止まってから、左右の確認を行い、ゆっくりと発進しましょう。",
        translations: {
          vi: "Hãy dừng lại một lần, kiểm tra hai bên và khởi hành chậm rãi.",
          en: "Stop briefly, check both sides, and start smoothly.",
          zh: "先停一下，确认左右情况，然后平稳起步。",
          pt: "Pare por um momento, verifique os dois lados e parta com calma."
        }
      },
      {
        key: "exam",
        label: "検定ポイント",
        japanese: "発進前にミラーと死角を確認して、車両の動きに合わせて安全に出ます。",
        translations: {
          vi: "Trước khi bắt đầu, kiểm tra gương và vùng chết để di chuyển an toàn.",
          en: "Before moving, check the mirrors and blind spots for safe departure.",
          zh: "起步前检查后视镜和盲区，确保安全出发。",
          pt: "Antes de partir, verifique os espelhos e os pontos cegos para uma saída segura."
        }
      },
      {
        key: "failure",
        label: "よくある失敗",
        japanese: "確認を省略してすぐ発進すると、他の車や歩行者に気づきにくくなります。",
        translations: {
          vi: "Bỏ qua việc kiểm tra và bắt đầu ngay có thể khiến bạn khó nhận ra xe và người đi bộ.",
          en: "Starting immediately without checking can make it hard to notice other vehicles or pedestrians.",
          zh: "忽略检查而直接起步，容易忽略其他车辆和行人。",
          pt: "Partir imediatamente sem verificar pode fazer você não perceber outros veículos ou pedestres."
        }
      },
      {
        key: "memory",
        label: "覚えておきたいこと",
        japanese: "「止まって、見る、確認して、出る」を意識すると安全です。",
        translations: {
          vi: "Hãy nhớ: 'Dừng lại, nhìn, kiểm tra, rồi đi'.",
          en: "Remember: 'Stop, look, check, and go'.",
          zh: "记住：'停下、看、确认、再出发'。",
          pt: "Lembre-se: 'Pare, olhe, verifique e siga'."
        }
      },
      {
        key: "phrase",
        label: "教習で使う一言",
        japanese: "「安全に確認してから出します。」",
        translations: {
          vi: "Tôi sẽ kiểm tra an toàn trước khi xuất phát.",
          en: "I will confirm safety before starting.",
          zh: "我会先确认安全再出发。",
          pt: "Vou confirmar a segurança antes de partir."
        }
      }
    ]
  },
  {
    id: 2,
    title: "第2項目",
    description: "速度に合わせてブレーキとアクセルを使い分ける。滑らかな操作が大切です。",
    sections: [
      {
        key: "tip",
        label: "教官ワンポイント",
        japanese: "速度変化は小さな操作で丁寧に行いましょう。",
        translations: {
          vi: "Thay đổi tốc độ nên được thực hiện bằng các thao tác nhỏ và nhẹ nhàng.",
          en: "Adjust speed with small, gentle inputs.",
          zh: "通过轻柔的小动作来调整速度。",
          pt: "Ajuste a velocidade com movimentos pequenos e suaves."
        }
      },
      {
        key: "exam",
        label: "検定ポイント",
        japanese: "減速時は視線を前方に保ち、急な操作を避けます。",
        translations: {
          vi: "Khi giảm tốc, hãy giữ mắt nhìn về phía trước và tránh thao tác đột ngột.",
          en: "When slowing down, keep your eyes ahead and avoid sudden inputs.",
          zh: "减速时保持向前看，避免突然操作。",
          pt: "Ao reduzir a velocidade, mantenha os olhos à frente e evite movimentos bruscos."
        }
      },
      {
        key: "failure",
        label: "よくある失敗",
        japanese: "急に踏み込むと車両が不安定になりやすいです。",
        translations: {
          vi: "Nhấn mạnh quá đột ngột có thể làm xe trở nên không ổn định.",
          en: "Pressing too hard too quickly can make the car unstable.",
          zh: "过急踩踏容易让车辆变得不稳定。",
          pt: "Apertar demais de repente pode deixar o carro instável."
        }
      },
      {
        key: "memory",
        label: "覚えておきたいこと",
        japanese: "アクセルはゆっくり、ブレーキは早めに確実に。",
        translations: {
          vi: "Ga nhẹ nhàng, phanh chắc chắn và kịp thời.",
          en: "Accelerate smoothly and brake firmly and in time.",
          zh: "油门轻柔，刹车要稳且及时。",
          pt: "Acelere suavemente e freie com firmeza e no tempo certo."
        }
      },
      {
        key: "phrase",
        label: "教習で使う一言",
        japanese: "「速さを合わせて、ゆっくり進めます。」",
        translations: {
          vi: "Tôi sẽ điều chỉnh tốc độ và tiến chậm rãi.",
          en: "I will adjust the speed and move slowly.",
          zh: "我会调整速度并缓慢前进。",
          pt: "Vou ajustar a velocidade e avançar devagar."
        }
      }
    ]
  },
  {
    id: 3,
    title: "第3項目",
    description: "コーナーでは減速とハンドル操作を合わせて、安全に曲がります。",
    sections: [
      {
        key: "tip",
        label: "教官ワンポイント",
        japanese: "曲がる前に速度を落とし、スムーズにハンドルを回しましょう。",
        translations: {
          vi: "Giảm tốc trước khi rẽ và quay vô lăng một cách trơn tru.",
          en: "Slow down before turning and steer smoothly.",
          zh: "转弯前先减速，并平稳转动方向盘。",
          pt: "Reduza a velocidade antes de virar e gire o volante com suavidade."
        }
      },
      {
        key: "exam",
        label: "検定ポイント",
        japanese: "コーナーでは視線を進行方向に向け、車体の傾きに注意します。",
        translations: {
          vi: "Trong khúc cua, hướng mắt về phía đi và chú ý đến độ nghiêng của xe.",
          en: "In a curve, look toward the direction of travel and watch the vehicle's lean.",
          zh: "转弯时注视前进方向，并注意车身倾斜。",
          pt: "Na curva, olhe na direção do movimento e observe a inclinação do veículo."
        }
      },
      {
        key: "failure",
        label: "よくある失敗",
        japanese: "急にハンドルを切ると、車体がぶれやすくなります。",
        translations: {
          vi: "Quay vô lăng quá đột ngột có thể làm xe lắc lư.",
          en: "Turning the wheel too sharply can make the vehicle wobble.",
          zh: "方向盘转得过急会让车辆晃动。",
          pt: "Virar o volante de forma brusca pode fazer o carro oscilar."
        }
      },
      {
        key: "memory",
        label: "覚えておきたいこと",
        japanese: "「減速して、見て、曲がる」を順番に行います。",
        translations: {
          vi: "Hãy làm theo thứ tự: giảm tốc, nhìn, rồi rẽ.",
          en: "Follow the order: slow down, look, then turn.",
          zh: "按顺序进行：先减速、再观察、然后转弯。",
          pt: "Siga a ordem: reduzir a velocidade, olhar e depois virar."
        }
      },
      {
        key: "phrase",
        label: "教習で使う一言",
        japanese: "「曲がる前に減速します。」",
        translations: {
          vi: "Tôi sẽ giảm tốc trước khi rẽ.",
          en: "I will slow down before turning.",
          zh: "我会在转弯前减速。",
          pt: "Vou reduzir a velocidade antes de virar."
        }
      }
    ]
  },
  {
    id: 4,
    title: "第4項目",
    description: "信号や標識を守り、交差点では優先順位を確認して進みます。",
    sections: [
      {
        key: "tip",
        label: "教官ワンポイント",
        japanese: "交差点では一旦停止と確認を徹底しましょう。",
        translations: {
          vi: "Tại ngã tư, hãy dừng lại và kiểm tra kỹ trước khi đi tiếp.",
          en: "At an intersection, stop briefly and check carefully before proceeding.",
          zh: "在交叉路口，先停一下并仔细确认后再前进。",
          pt: "Na interseção, pare brevemente e confira com cuidado antes de prosseguir."
        }
      },
      {
        key: "exam",
        label: "検定ポイント",
        japanese: "右左確認と一時停止を繰り返し、安全に通行します。",
        translations: {
          vi: "Kiểm tra trái phải và dừng tạm thời để đi an toàn.",
          en: "Check left and right and stop briefly for safe passage.",
          zh: "确认左右并短暂停止，安全通行。",
          pt: "Verifique à esquerda e à direita e pare brevemente para passar com segurança."
        }
      },
      {
        key: "failure",
        label: "よくある失敗",
        japanese: "急な進入や確認不足は事故の原因になります。",
        translations: {
          vi: "Vào đường quá đột ngột hoặc thiếu kiểm tra có thể gây tai nạn.",
          en: "Entering suddenly or failing to check can cause accidents.",
          zh: "突然进入或确认不足会导致事故。",
          pt: "Entrar de forma brusca ou não verificar pode causar acidentes."
        }
      },
      {
        key: "memory",
        label: "覚えておきたいこと",
        japanese: "「止まる・見る・待つ」を守ることが大切です。",
        translations: {
          vi: "Điều quan trọng là 'dừng lại, nhìn và đợi'.",
          en: "It is important to 'stop, look, and wait'.",
          zh: "重要的是'停下、看、等待'。",
          pt: "É importante 'parar, olhar e esperar'."
        }
      },
      {
        key: "phrase",
        label: "教習で使う一言",
        japanese: "「確認してから進めます。」",
        translations: {
          vi: "Tôi sẽ kiểm tra trước khi đi tiếp.",
          en: "I will check before proceeding.",
          zh: "我会先确认再前进。",
          pt: "Vou conferir antes de prosseguir."
        }
      }
    ]
  },
  {
    id: 5,
    title: "第5項目",
    description: "駐車や停車では安全な位置を選び、車両を丁寧に扱います。",
    sections: [
      {
        key: "tip",
        label: "教官ワンポイント",
        japanese: "停車前に周囲とスペースを確認して、ゆっくり入れます。",
        translations: {
          vi: "Trước khi đỗ, hãy kiểm tra xung quanh và không gian rồi dần dần vào chỗ.",
          en: "Before parking, check the surroundings and space, then enter slowly.",
          zh: "停车前先确认周围和空间，然后缓慢驶入。",
          pt: "Antes de estacionar, verifique o entorno e o espaço, depois entre devagar."
        }
      },
      {
        key: "exam",
        label: "検定ポイント",
        japanese: "駐車時は安全な間隔を保ち、車両を正しく置きます。",
        translations: {
          vi: "Khi đỗ xe, giữ khoảng cách an toàn và đặt xe đúng vị trí.",
          en: "When parking, keep a safe distance and place the vehicle correctly.",
          zh: "停车时保持安全距离并正确停放车辆。",
          pt: "Ao estacionar, mantenha uma distância segura e coloque o veículo corretamente."
        }
      },
      {
        key: "failure",
        label: "よくある失敗",
        japanese: "狭いスペースに無理に入れると、車両がぶつかりやすくなります。",
        translations: {
          vi: "Cố gắng vào chỗ quá hẹp có thể làm xe dễ va chạm.",
          en: "Forcing the vehicle into a tight space can make it easier to collide.",
          zh: "硬要挤进狭小空间容易导致车辆碰撞。",
          pt: "Forçar o veículo em um espaço apertado pode facilitar colisões."
        }
      },
      {
        key: "memory",
        label: "覚えておきたいこと",
        japanese: "「ゆっくり、確認して、丁寧に」が基本です。",
        translations: {
          vi: "Cơ bản là 'chậm rãi, kiểm tra và cẩn thận'.",
          en: "The basics are 'slowly, carefully, and with checks'.",
          zh: "基础是'慢慢来、确认、认真操作'。",
          pt: "O básico é 'devagar, com atenção e cuidado'."
        }
      },
      {
        key: "phrase",
        label: "教習で使う一言",
        japanese: "「安全に停めます。」",
        translations: {
          vi: "Tôi sẽ đỗ xe an toàn.",
          en: "I will park safely.",
          zh: "我会安全停车。",
          pt: "Vou estacionar com segurança."
        }
      }
    ]
  }
];
